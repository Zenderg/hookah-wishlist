import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  details?: any;
}

export function errorHandler(err: ApiError, req: Request, res: Response, _next: NextFunction): void {
  logger.error('API Error:', {
    message: err.message,
    statusCode: err.statusCode,
    details: err.details,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err.details }),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
}
