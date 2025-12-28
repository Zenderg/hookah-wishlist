import cron from 'node-cron';
import logger from './config/logger.js';
import { runSingleScrape } from './scrapers/scraperController.js';
import { testConnection, disconnectDatabase } from './services/database.js';

/**
 * Get cron schedule from environment variable
 * Default: "0 2 * * *" (2 AM UTC daily)
 */
const SCRAPER_SCHEDULE = process.env.SCRAPER_SCHEDULE || '0 2 * * *';

/**
 * Run the scraper with proper logging and error handling
 * @returns Promise that resolves when scraping is complete
 */
async function runScraper(): Promise<void> {
  const startTime = Date.now();
  logger.info('='.repeat(50));
  logger.info('SCRAPER STARTED');
  logger.info('='.repeat(50));

  try {
    // Test database connection before starting
    await testConnection();

    // Run the scraper
    const metrics = await runSingleScrape();

    // Log completion
    const endTime = Date.now();
    const duration = endTime - startTime;

    logger.info('='.repeat(50));
    logger.info('SCRAPER COMPLETED SUCCESSFULLY');
    logger.info(`Total Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    logger.info('='.repeat(50));
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error('='.repeat(50));
    logger.error('SCRAPER FAILED');
    logger.error(`Error: ${errorMessage}`);
    logger.error(`Total Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    logger.error('='.repeat(50));

    throw error;
  } finally {
    // Ensure database is disconnected
    try {
      await disconnectDatabase();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error disconnecting database: ${errorMessage}`);
    }
  }
}

/**
 * Schedule the scraper to run on a cron schedule
 * @param schedule - Cron schedule expression
 * @returns Scheduled task
 */
function scheduleScraper(schedule: string): cron.ScheduledTask {
  logger.info(`Scheduling scraper with cron expression: ${schedule}`);

  const task = cron.schedule(schedule, async () => {
    try {
      await runScraper();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Scheduled scraper run failed: ${errorMessage}`);
    }
  });

  logger.info('Scraper scheduled successfully');
  return task;
}

/**
 * Handle graceful shutdown
 * @param signal - Signal that triggered the shutdown
 */
function handleShutdown(signal: string): void {
  logger.info(`Received ${signal}, initiating graceful shutdown...`);

  // Stop any running cron tasks
  // Note: node-cron doesn't have a built-in stop method, but we can prevent new runs

  // Wait a bit for cleanup
  setTimeout(() => {
    logger.info('Shutdown complete');
    process.exit(0);
  }, 2000);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  logger.info('='.repeat(50));
  logger.info('HOOKAH WISHLIST SCRAPER');
  logger.info('='.repeat(50));
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Log Level: ${process.env.LOG_LEVEL || 'info'}`);
  logger.info(`Cron Schedule: ${SCRAPER_SCHEDULE}`);
  logger.info('='.repeat(50));

  try {
    // Schedule the scraper
    const task = scheduleScraper(SCRAPER_SCHEDULE);

    // Run the scraper once on startup for initial data
    logger.info('Running initial scraper on startup...');
    try {
      await runScraper();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Initial scraper run failed: ${errorMessage}`);
      // Don't exit, let the scheduled runs continue
    }

    // Set up graceful shutdown handlers
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      handleShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      handleShutdown('unhandledRejection');
    });

    logger.info('Scraper is running. Press Ctrl+C to stop.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to start scraper: ${errorMessage}`);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  logger.error('Fatal error starting scraper:', error);
  process.exit(1);
});

export { runScraper, scheduleScraper, handleShutdown };
export default main;
