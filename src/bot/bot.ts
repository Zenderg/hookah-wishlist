import TelegramBot from 'node-telegram-bot-api';
import logger from '@/utils/logger';
import { sessionManager } from './session';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
}

export const bot = new TelegramBot(token, { polling: true });

bot.on('polling_error', (error) => {
  logger.error('Telegram bot polling error:', error);
});

bot.on('error', (error) => {
  logger.error('Telegram bot error:', error);
});

// Initialize session for new users
bot.onText(/\/.*/, async (msg) => {
  const userId = msg.from?.id;
  if (userId && !sessionManager.get(userId)) {
    sessionManager.set(userId, { userId });
    logger.info(`New user initialized: ${userId}`);
  }
});

logger.info('Telegram bot initialized successfully');

export default bot;
