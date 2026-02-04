import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { parse } from '@tma.js/init-data-node';

export const TelegramId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const initDataRaw = request.headers['x-telegram-init-data'];

    if (!initDataRaw) {
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
