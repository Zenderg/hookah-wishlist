import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { parse } from '@tma.js/init-data-node';

export const TelegramId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const initDataRaw = request.headers['x-telegram-init-data'];

    // If no init data header, check request body or query params for telegramId
    // This allows local development without Telegram Mini Apps context
    if (!initDataRaw) {
      const bodyTelegramId = request.body?.telegramId;
      const queryTelegramId = request.query?.telegramId;

      if (bodyTelegramId) {
        return bodyTelegramId;
      }

      if (queryTelegramId) {
        return queryTelegramId;
      }

      // In development mode, use mock Telegram ID
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        const mockTelegramId = '123456789';
        console.warn('Using mock Telegram ID for local development:', mockTelegramId);
        return mockTelegramId;
      }

      throw new Error('Telegram init data not found in headers');
    }

    try {
      const initData = parse(initDataRaw);
      const telegramId = initData.user?.id?.toString();

      if (!telegramId) {
        throw new Error('Telegram user ID not found in init data');
      }

      return telegramId;
    } catch (error) {
      throw new Error('Failed to parse Telegram init data');
    }
  },
);
