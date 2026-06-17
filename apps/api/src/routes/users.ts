import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma';

export async function userRoutes(app: FastifyInstance) {
  // GET /api/users/:username
  app.get('/:username', async (request, reply) => {
    const { username } = request.params as { username: string };
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true, username: true, avatarUrl: true, bio: true,
        followersCount: true, followingCount: true, videosCount: true,
        isVerified: true, createdAt: true,
        videos: {
          where: { status: 'published' },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!user) return reply.code(404).send({ success: false, message: 'User not found' });
    return reply.send({ success: true, data: { user } });
  });

  // POST /api/users/:userId/follow  — requires auth
  app.post(
    '/:userId/follow',
    { onRequest: [(app as any).authenticate] },
    async (request, reply) => {
      const { userId: targetId } = request.params as { userId: string };
      const followerId = ((request as any).user as { sub: string }).sub;

      if (followerId === targetId) {
        return reply.code(400).send({ success: false, message: 'Cannot follow yourself' });
      }

      const existing = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId, followingId: targetId } },
      });

      if (existing) {
        await prisma.follow.delete({
          where: { followerId_followingId: { followerId, followingId: targetId } },
        });
        await prisma.user.update({ where: { id: targetId }, data: { followersCount: { decrement: 1 } } });
        await prisma.user.update({ where: { id: followerId }, data: { followingCount: { decrement: 1 } } });
        return reply.send({ success: true, data: { following: false } });
      }

      await prisma.follow.create({ data: { followerId, followingId: targetId } });
      await prisma.user.update({ where: { id: targetId }, data: { followersCount: { increment: 1 } } });
      await prisma.user.update({ where: { id: followerId }, data: { followingCount: { increment: 1 } } });
      return reply.send({ success: true, data: { following: true } });
    }
  );

  // PATCH /api/users/me  — update profile
  app.patch(
    '/me',
    { onRequest: [(app as any).authenticate] },
    async (request, reply) => {
      const userId = ((request as any).user as { sub: string }).sub;
      const body = z
        .object({
          bio: z.string().max(300).optional(),
          avatarUrl: z.string().url().optional(),
        })
        .safeParse(request.body);

      if (!body.success) {
        return reply.code(400).send({ success: false, message: body.error.issues[0].message });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: body.data,
        select: { id: true, username: true, avatarUrl: true, bio: true },
      });
      return reply.send({ success: true, data: { user } });
    }
  );
}
