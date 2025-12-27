import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger.js';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    path: request.url,
    method: request.method,
  });

  // Handle validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation,
    });
  }

  // Handle known HTTP errors
  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
    });
  }

  // Handle unknown errors
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
  });
}
