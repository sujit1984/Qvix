import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db/prisma';

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register
  app.post('/register', async (request, reply) => {
    const body = registerSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, message: body.error.issues[0].message });
    }

    const { username, email, password } = body.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return reply.code(409).send({ success: false, message: 'Username or email already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, email, passwordHash },
    });

    const token = app.jwt.sign({ sub: user.id, username: user.username });
    return reply.code(201).send({
      success: true,
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  });

  // POST /api/auth/login
  app.post('/login', async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, message: 'Invalid credentials format' });
    }

    const { email, password } = body.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.code(401).send({ success: false, message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ success: false, message: 'Invalid email or password' });
    }

    const token = app.jwt.sign({ sub: user.id, username: user.username });
    return reply.send({ success: true, data: { token, user: sanitizeUser(user) } });
  });

  // GET /api/auth/me
  app.get('/me', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
    const payload = (request as any).user as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return reply.code(404).send({ success: false, message: 'User not found' });
    return reply.send({ success: true, data: { user: sanitizeUser(user) } });
  });
}

function sanitizeUser(user: any) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}
