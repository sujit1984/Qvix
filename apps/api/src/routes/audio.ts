import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';

export async function audioRoutes(app: FastifyInstance) {
  // GET /api/audio/trending  — top audio tracks
  app.get('/trending', async (_request, reply) => {
    const tracks = await prisma.audioTrack.findMany({
      orderBy: { usedByCount: 'desc' },
      take: 50,
    });
    return reply.send({ success: true, data: { tracks } });
  });

  // GET /api/audio/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const track = await prisma.audioTrack.findUnique({ where: { id } });
    if (!track) return reply.code(404).send({ success: false, message: 'Track not found' });
    return reply.send({ success: true, data: { track } });
  });
}
