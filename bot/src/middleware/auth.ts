import { Middleware } from 'telegraf';
import { Context } from 'telegraf';
import { logger } from '../utils/logger.js';

export const authMiddleware: Middleware<Context> = async (ctx, next) => {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      logger.warn('No telegram ID found in context');
      return;
    }

    (ctx as any).telegramId = telegramId;

    await next();
  } catch (error) {
    logger.error('Error in auth middleware:', error);
  }
};
