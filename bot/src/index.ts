import { Telegraf } from 'telegraf';
import { logger } from './utils/logger.js';
import { authMiddleware } from './middleware/auth.js';
import { startCommand } from './commands/start.js';
import { helpCommand } from './commands/help.js';
import { listCommand } from './commands/list.js';
import { addCommand, handleAddSearch } from './commands/add.js';
import { removeCommand } from './commands/remove.js';
import { clearCommand } from './commands/clear.js';
import { appCommand } from './commands/app.js';
import { handleCallbackQuery } from './handlers/callbacks.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  logger.error('TELEGRAM_BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

logger.info('TELEGRAM_BOT_TOKEN is set (length: ' + TELEGRAM_BOT_TOKEN.length + ')');

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

logger.info('Telegraf bot instance created');

bot.use(authMiddleware);

logger.info('Auth middleware registered');

bot.command('start', async (ctx) => {
  await startCommand(ctx);
});

bot.command('help', async (ctx) => {
  await helpCommand(ctx);
});

bot.command('list', async (ctx) => {
  await listCommand(ctx);
});

bot.command('add', async (ctx) => {
  await addCommand(ctx);
});

bot.command('remove', async (ctx) => {
  await removeCommand(ctx);
});

bot.command('clear', async (ctx) => {
  await clearCommand(ctx);
});

bot.command('app', async (ctx) => {
  await appCommand(ctx);
});

// Handle callback queries from inline keyboards
bot.on('callback_query', async (ctx) => {
  await handleCallbackQuery(ctx);
});

// Handle text messages for search functionality
bot.on('text', async (ctx) => {
  const telegramId = ctx.from?.id;
  const messageText = 'text' in ctx.message ? ctx.message.text : undefined;

  logger.info(`Received text message from user ${telegramId}: ${messageText}`);

  // Handle search for /add command - only process non-command text messages
  if (messageText && !messageText.startsWith('/')) {
    await handleAddSearch(ctx);
  }
});

bot.catch((err, ctx) => {
  logger.error(`Error for ${ctx.updateType}:`, err);
  void ctx.reply('An error occurred while processing your request. Please try again.');
});

logger.info('All bot commands and handlers registered');

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  try {
    await bot.stop();
    logger.info('Bot stopped successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

logger.info('Shutdown handlers registered');

const testNetworkConnectivity = async (): Promise<void> => {
  logger.info('Testing network connectivity to Telegram API...');
  try {
    const response = await fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/getMe');
    if (response.ok) {
      logger.info('Network connectivity test passed. Telegram API is reachable.');
      const data = (await response.json()) as {
        ok: boolean;
        result?: { username: string };
        description?: string;
      };
      if (data.ok && data.result) {
        logger.info(`Bot authenticated successfully: @${data.result.username}`);
      } else {
        logger.error('Bot authentication failed:', data.description);
      }
    } else {
      logger.error('Network connectivity test failed. Status:', response.status);
      throw new Error(`Failed to connect to Telegram API: ${response.status}`);
    }
  } catch (error) {
    logger.error('Network connectivity test error:', error);
    throw error;
  }
};

const startBot = async (): Promise<void> => {
  try {
    logger.info('Starting Hookah Wishlist Bot...');

    // Test network connectivity first
    await testNetworkConnectivity();

    logger.info('Calling bot.launch()...');

    // Launch bot - this will start polling and keep the process running
    // bot.launch() is designed to run indefinitely, so we don't await it
    bot.launch().catch((error) => {
      logger.error('Bot polling error:', error);
      process.exit(1);
    });

    // Give the bot a moment to start
    await new Promise((resolve) => setTimeout(resolve, 2000));

    logger.info('Bot started successfully!');
    logger.info('Bot is now polling for updates');
  } catch (error) {
    logger.error('Failed to start bot:', error);
    if (error instanceof Error) {
      logger.error('Error message:', error.message);
      logger.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
};

void startBot();
