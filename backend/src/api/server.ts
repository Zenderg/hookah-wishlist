import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from '@/utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRoutes from './routes';

/**
 * Configures CORS for the application
 * Supports single origin, multiple origins, or wildcard (development only)
 */
const configureCors = () => {
  const miniAppUrl = process.env.MINI_APP_URL;
  const nodeEnv = process.env.NODE_ENV || 'development';

  // In development, allow all origins for easier testing
  if (nodeEnv === 'development') {
    logger.info('[CORS] Development mode: allowing all origins');
    return cors({
      origin: '*',
      credentials: true,
    });
  }

  // In production, require MINI_APP_URL to be set
  if (!miniAppUrl) {
    logger.warn('[CORS] WARNING: MINI_APP_URL not set in production. This may cause CORS issues.');
    logger.warn('[CORS] Set MINI_APP_URL to your frontend domain (e.g., https://your-domain.com/mini-app)');
    
    // Fallback to wildcard but log warning
    return cors({
      origin: '*',
      credentials: true,
    });
  }

  // Support multiple origins (comma-separated)
  const allowedOrigins = miniAppUrl.split(',').map(origin => origin.trim());
  
  logger.info('[CORS] Production mode: allowing requests from:', allowedOrigins);

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        // Exact match
        if (origin === allowedOrigin) {
          return true;
        }
        
        // Subdomain match (e.g., *.domain.com)
        if (allowedOrigin.startsWith('*.')) {
          const domain = allowedOrigin.slice(2);
          return origin.endsWith(domain);
        }
        
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`[CORS] Request from origin "${origin}" not allowed. Allowed origins:`, allowedOrigins);
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400, // 24 hours
  });
};

export function createServer(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS middleware
  app.use(configureCors());

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Health check endpoint (root level)
  app.get('/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      cors: {
        miniAppUrl: process.env.MINI_APP_URL || 'not set',
        nodeEnv: process.env.NODE_ENV || 'development',
      }
    });
  });

  // API routes
  app.use('/api', apiRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createServer;
