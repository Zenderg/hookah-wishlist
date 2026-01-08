import 'dotenv/config';
import bot from './bot/bot';
import { registerCommands } from './bot/commands';
import createServer from './api/server';
import logger from './utils/logger';

// Register all bot commands
registerCommands();

// Create and start API server
const app = createServer();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  logger.info(`API server listening on port ${port}`);
});

logger.info('Hookah Wishlist Bot started successfully!');

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down bot and server...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down bot and server...');
  bot.stopPolling();
  process.exit(0);
});
