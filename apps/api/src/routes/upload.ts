import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma';
import { VideoProcessingService } from '../services/VideoProcessingService';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? './uploads');

export async function uploadRoutes(app: FastifyInstance) {
  // POST /api/upload/video  — requires auth
  app.post(
    '/video',
    { onRequest: [(app as any).authenticate] },
    async (request, reply) => {
      const userId = ((request as any).user as { sub: string }).sub;

      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ success: false, message: 'No file provided' });
      }

      // Validate MIME type
      const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
      if (!allowed.includes(data.mimetype)) {
        return reply.code(415).send({ success: false, message: 'Unsupported video format' });
      }

      const videoId = uuidv4();
      const ext = path.extname(data.filename) || '.mp4';
      const rawFilename = `${videoId}_raw${ext}`;
      const rawPath = path.join(UPLOAD_DIR, 'raw', rawFilename);

      // Ensure directory exists
      fs.mkdirSync(path.join(UPLOAD_DIR, 'raw'), { recursive: true });
      fs.mkdirSync(path.join(UPLOAD_DIR, 'processed'), { recursive: true });
      fs.mkdirSync(path.join(UPLOAD_DIR, 'thumbnails'), { recursive: true });

      // Stream to disk
      await pipeline(data.file, fs.createWriteStream(rawPath));

      // Parse metadata from fields (sent alongside file)
      const fields = (request as any).body ?? {};
      const description = String(fields.description ?? '');
      const trendTitle = String(fields.trendTitle ?? '');
      const isWarpDrop = String(fields.isWarpDrop ?? 'false') === 'true';

      // Create DB record first (status: processing)
      const video = await prisma.video.create({
        data: {
          id: videoId,
          creatorId: userId,
          videoUrl: `/uploads/processed/${videoId}.mp4`,
          thumbnailUrl: `/uploads/thumbnails/${videoId}.jpg`,
          description,
          trendTitle: trendTitle || null,
          isWarpDrop,
          status: 'processing',
        },
      });

      // Kick off async processing (don't await — return immediately)
      VideoProcessingService.process({ videoId, rawPath, uploadDir: UPLOAD_DIR }).catch(
        (err: Error) => app.log.error({ err }, 'Video processing failed')
      );

      return reply.code(202).send({
        success: true,
        data: {
          videoId: video.id,
          status: 'processing',
          message: 'Video uploaded and is being processed',
        },
      });
    }
  );

  // GET /api/upload/status/:videoId  — poll processing status
  app.get(
    '/status/:videoId',
    { onRequest: [(app as any).authenticate] },
    async (request, reply) => {
      const { videoId } = request.params as { videoId: string };
      const userId = ((request as any).user as { sub: string }).sub;

      const video = await prisma.video.findFirst({
        where: { id: videoId, creatorId: userId },
        select: { id: true, status: true, videoUrl: true, thumbnailUrl: true },
      });

      if (!video) {
        return reply.code(404).send({ success: false, message: 'Video not found' });
      }

      return reply.send({ success: true, data: video });
    }
  );
}
