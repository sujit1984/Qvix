import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma';

const paramsSchema = z.object({ id: z.string().uuid() });

export async function videoRoutes(app: FastifyInstance) {
  // GET /api/videos/:id
  app.get('/:id', async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ success: false, message: 'Invalid video ID' });

    const video = await prisma.video.findUnique({
      where: { id: params.data.id },
      include: { creator: true, audioTrack: true, variants: { include: { creator: true } } },
    });
    if (!video) return reply.code(404).send({ success: false, message: 'Video not found' });

    await prisma.video.update({ where: { id: video.id }, data: { viewsCount: { increment: 1 } } });

    return reply.send({ success: true, data: { video } });
  });

  // POST /api/videos/:id/like  — requires auth
  app.post('/:id/like', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ success: false, message: 'Invalid video ID' });

    const userId = ((request as any).user as { sub: string }).sub;

    const existing = await prisma.like.findUnique({
      where: { userId_videoId: { userId, videoId: params.data.id } },
    });

    if (existing) {
      await prisma.like.delete({ where: { userId_videoId: { userId, videoId: params.data.id } } });
      await prisma.video.update({ where: { id: params.data.id }, data: { likesCount: { decrement: 1 } } });
      return reply.send({ success: true, data: { liked: false } });
    }

    await prisma.like.create({ data: { userId, videoId: params.data.id } });
    await prisma.video.update({ where: { id: params.data.id }, data: { likesCount: { increment: 1 } } });
    return reply.send({ success: true, data: { liked: true } });
  });

  // GET /api/videos/:id/comments
  app.get('/:id/comments', async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ success: false, message: 'Invalid video ID' });

    const comments = await prisma.comment.findMany({
      where: { videoId: params.data.id, parentId: null },
      include: { author: true, replies: { include: { author: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return reply.send({ success: true, data: { comments } });
  });

  // POST /api/videos/:id/comments  — requires auth
  app.post(
    '/:id/comments',
    { onRequest: [(app as any).authenticate] },
    async (request, reply) => {
      const params = paramsSchema.safeParse(request.params);
      if (!params.success) return reply.code(400).send({ success: false, message: 'Invalid video ID' });

      const body = z.object({ text: z.string().min(1).max(500) }).safeParse(request.body);
      if (!body.success) return reply.code(400).send({ success: false, message: body.error.issues[0].message });

      const userId = ((request as any).user as { sub: string }).sub;
      const comment = await prisma.comment.create({
        data: { text: body.data.text, videoId: params.data.id, authorId: userId },
        include: { author: true },
      });
      await prisma.video.update({ where: { id: params.data.id }, data: { commentsCount: { increment: 1 } } });

      return reply.code(201).send({ success: true, data: { comment } });
    }
  );
}
