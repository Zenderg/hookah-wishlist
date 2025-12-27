import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return reply.status(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        service: 'hookah-wishlist-api',
      });
    } catch {
      return reply.status(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable',
      });
    }
  });
}
