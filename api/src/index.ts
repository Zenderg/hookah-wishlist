import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import logger from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRoutes } from './routes/health.js';

// Initialize Fastify server
const fastify = Fastify({
  logger: false, // We use Winston instead
});

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with adapter
const prisma = new PrismaClient({
  adapter,
});

// Register CORS
await fastify.register(cors, {
  origin: true, // Allow all origins for development
});

// Register custom error handler
fastify.setErrorHandler(errorHandler);

// Register health check routes
await fastify.register(healthRoutes);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  try {
    await fastify.close();
    logger.info('Fastify server closed');

    await prisma.$disconnect();
    logger.info('Prisma client disconnected');

    await pool.end();
    logger.info('PostgreSQL pool closed');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT');
});

// Start server
const start = async (): Promise<void> => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';

    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    await fastify.listen({ port, host });
    logger.info(`Server listening on ${host}:${port}`);
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
void start();
