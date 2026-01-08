import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: number;
  user?: {
    id: number;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
}

export function authenticateTelegramUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const initData = req.headers['x-telegram-init-data'] as string;

    if (!initData) {
      res.status(401).json({ error: 'Unauthorized: Missing Telegram init data' });
      return;
    }

    // Parse init data from Telegram WebApp
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');

    if (!userParam) {
      res.status(401).json({ error: 'Unauthorized: Invalid user data' });
      return;
    }

    const user = JSON.parse(decodeURIComponent(userParam));

    if (!user.id) {
      res.status(401).json({ error: 'Unauthorized: Missing user ID' });
      return;
    }

    req.userId = user.id;
    req.user = user;

    logger.debug(`Authenticated user ${user.id} from Telegram WebApp`);

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid authentication data' });
  }
}
