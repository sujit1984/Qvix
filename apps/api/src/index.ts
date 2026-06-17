import 'dotenv/config';
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

import { authRoutes } from './routes/auth';
import { feedRoutes } from './routes/feed';
import { videoRoutes } from './routes/videos';
import { userRoutes } from './routes/users';
import { audioRoutes } from './routes/audio';
import { uploadRoutes } from './routes/upload';
import { registerSocketHandlers } from './socket/handlers';

const PORT = parseInt(process.env.PORT ?? '4000', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? './uploads');

async function bootstrap() {
  const app = Fastify({
    logger: { level: process.env.NODE_ENV === 'production' ? 'warn' : 'info' },
    trustProxy: true,
  });

  // ── Security ────────────────────────────────────────────────────────────────
  await app.register(fastifyHelmet, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  await app.register(fastifyCors, {
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(fastifyRateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      success: false,
      message: 'Too many requests. Slow down!',
    }),
  });

  // ── Auth ────────────────────────────────────────────────────────────────────
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? 'fallback-dev-secret',
    sign: { expiresIn: '7d' },
  });

  // ── Multipart (video uploads) ───────────────────────────────────────────────
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE_MB ?? '500', 10) * 1024 * 1024,
    },
  });

  // ── Static file serving for uploaded videos ─────────────────────────────────
  await app.register(fastifyStatic, {
    root: UPLOAD_DIR,
    prefix: '/uploads/',
    decorateReply: false,
  });

  // ── Auth decorator ──────────────────────────────────────────────────────────
  app.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ success: false, message: 'Unauthorized' });
    }
  });

  // ── Routes ──────────────────────────────────────────────────────────────────
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(feedRoutes, { prefix: '/api/feed' });
  await app.register(videoRoutes, { prefix: '/api/videos' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(audioRoutes, { prefix: '/api/audio' });
  await app.register(uploadRoutes, { prefix: '/api/upload' });

  // ── Health check ────────────────────────────────────────────────────────────
  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  // ── Socket.IO ───────────────────────────────────────────────────────────────
  const io = new SocketIOServer(app.server, {
    cors: { origin: CORS_ORIGIN, credentials: true },
  });
  registerSocketHandlers(io);

  // ── Start ───────────────────────────────────────────────────────────────────
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`🚀 Qvix API running on http://localhost:${PORT}`);
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
