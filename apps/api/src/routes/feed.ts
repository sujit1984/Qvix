import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { QuantumFeedService } from '../services/QuantumFeedService';

const querySchema = z.object({
  cursor: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(20).default(10),
});

export async function feedRoutes(app: FastifyInstance) {
  const feedService = new QuantumFeedService();

  // GET /api/feed  — public (anonymous or authenticated)
  app.get('/', async (request, reply) => {
    const query = querySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ success: false, message: 'Invalid query parameters' });
    }

    // Optionally use auth for personalisation
    let userId: string | undefined;
    try {
      await (request as any).jwtVerify();
      userId = ((request as any).user as { sub: string }).sub;
    } catch {
      // Anonymous — still works, just no personalisation
    }

    const page = await feedService.getPage({
      userId,
      cursor: query.data.cursor,
      limit: query.data.limit,
    });

    return reply.send({ success: true, data: page });
  });

  // POST /api/feed/warp  — trigger a Warp Drop manually
  app.post('/warp', async (request, reply) => {
    const warpVideo = await feedService.getWarpDrop();
    return reply.send({ success: true, data: { video: warpVideo } });
  });
}
