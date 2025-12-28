import { chromium, Browser, Page, BrowserContext } from 'playwright';
import logger from '../config/logger.js';
import { scrapeBrands, deduplicateBrands } from './brandScraper.js';
import { scrapeAllTobaccos } from './tobaccoScraper.js';
import * as database from '../services/database.js';
import type { ScrapedBrand, ScrapedTobacco, ScrapeMetrics, ScrapeConfig } from '../types/index.js';

/**
 * Create scraper configuration from environment variables
 * @returns ScrapeConfig object
 */
export function createScrapeConfig(): ScrapeConfig {
  return {
    timeout: parseInt(process.env.SCRAPER_TIMEOUT || '60000', 10),
    maxRetries: parseInt(process.env.SCRAPER_MAX_RETRIES || '3', 10),
    delayBrand: parseInt(process.env.SCRAPER_DELAY_BRAND || '2000', 10),
    delayTobacco: parseInt(process.env.SCRAPER_DELAY_TOBACCO || '1000', 10),
  };
}

/**
 * Initialize Playwright browser with proper configuration
 * @returns Promise resolving to Browser and Page instances
 */
async function initializeBrowser(): Promise<{
  browser: Browser;
  context: BrowserContext;
  page: Page;
}> {
  logger.info('Initializing Playwright browser');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // Set default timeout
  page.setDefaultTimeout(parseInt(process.env.SCRAPER_TIMEOUT || '60000', 10));

  logger.info('Playwright browser initialized successfully');

  return { browser, context, page };
}

/**
 * Close browser and cleanup resources
 * @param browser - Browser instance to close
 * @param context - Browser context to close
 */
async function cleanupBrowser(browser: Browser, context: BrowserContext): Promise<void> {
  try {
    await context.close();
    await browser.close();
    logger.info('Browser closed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error closing browser: ${errorMessage}`);
  }
}

/**
 * Process scraped brands and save to database
 * @param brands - Array of ScrapedBrand objects
 * @returns Promise resolving to number of brands added
 */
async function processBrands(brands: ScrapedBrand[]): Promise<number> {
  let brandsAdded = 0;

  logger.info(`Processing ${brands.length} brands`);

  for (const brand of brands) {
    try {
      const result = await database.upsertBrand(brand);

      if (result.success && result.isNew) {
        brandsAdded++;
        logger.debug(`Added new brand: ${brand.name}`);
      } else if (result.success && !result.isNew) {
        logger.debug(`Updated existing brand: ${brand.name}`);
      } else {
        logger.warn(`Failed to upsert brand ${brand.name}: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error processing brand ${brand.name}: ${errorMessage}`);
    }
  }

  logger.info(`Brand processing complete. Added: ${brandsAdded}`);
  return brandsAdded;
}

/**
 * Process scraped tobaccos and save to database
 * @param tobaccos - Array of ScrapedTobacco objects
 * @param brandId - Database ID of the brand
 * @returns Promise resolving to object with added and updated counts
 */
async function processTobaccos(
  tobaccos: ScrapedTobacco[],
  brandId: number
): Promise<{ added: number; updated: number }> {
  let added = 0;
  let updated = 0;

  logger.info(`Processing ${tobaccos.length} tobaccos for brand ID ${brandId}`);

  for (const tobacco of tobaccos) {
    try {
      const result = await database.upsertTobacco(brandId, tobacco);

      if (result.success && result.isNew) {
        added++;
        logger.debug(`Added new tobacco: ${tobacco.name}`);
      } else if (result.success && !result.isNew) {
        updated++;
        logger.debug(`Updated existing tobacco: ${tobacco.name}`);
      } else {
        logger.warn(`Failed to upsert tobacco ${tobacco.name}: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error processing tobacco ${tobacco.name}: ${errorMessage}`);
    }
  }

  logger.info(
    `Tobacco processing complete for brand ID ${brandId}. Added: ${added}, Updated: ${updated}`
  );

  return { added, updated };
}

/**
 * Run the complete scraping process
 * @returns Promise resolving to ScrapeMetrics object
 */
export async function runScraper(): Promise<ScrapeMetrics> {
  const startTime = Date.now();
  const metrics: ScrapeMetrics = {
    brandsAdded: 0,
    tobaccosAdded: 0,
    tobaccosUpdated: 0,
    errors: 0,
    duration: 0,
    failedUrls: [],
  };

  const config = createScrapeConfig();
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    logger.info('Starting scraper process');
    logger.debug('Scrape config:', config);

    // Initialize database connection
    await database.testConnection();

    // Initialize browser
    const browserSetup = await initializeBrowser();
    browser = browserSetup.browser;
    context = browserSetup.context;
    page = browserSetup.page;

    // Step 1: Scrape brands
    logger.info('Step 1: Scraping brands');
    let scrapedBrands: ScrapedBrand[] = [];

    try {
      scrapedBrands = await scrapeBrands(page, config);
      scrapedBrands = deduplicateBrands(scrapedBrands);
      logger.info(`Scraped ${scrapedBrands.length} unique brands`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to scrape brands: ${errorMessage}`);
      metrics.errors++;
      throw error;
    }

    // Step 2: Process brands and save to database
    logger.info('Step 2: Processing brands');
    try {
      metrics.brandsAdded = await processBrands(scrapedBrands);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to process brands: ${errorMessage}`);
      metrics.errors++;
      throw error;
    }

    // Step 3: Scrape tobaccos for each brand
    logger.info('Step 3: Scraping tobaccos');
    const allTobaccos: Array<{
      tobacco: ScrapedTobacco;
      brandId: number;
    }> = [];

    for (const brand of scrapedBrands) {
      try {
        // Get brand ID from database
        const brandRecord = await database.getBrandBySlug(brand.slug);

        if (!brandRecord) {
          logger.warn(
            `Brand ${brand.slug} not found in database, skipping tobacco scrape`
          );
          metrics.failedUrls.push(brand.htreviewsUrl);
          continue;
        }

        logger.info(
          `Scraping tobaccos for brand: ${brand.name} (ID: ${brandRecord.id})`
        );

        // Scrape tobaccos for this brand
        const tobaccos = await scrapeAllTobaccos(page, [brand], config);

        // Store with brand ID for database insertion
        for (const tobacco of tobaccos) {
          allTobaccos.push({ tobacco, brandId: brandRecord.id });
        }

        logger.info(`Scraped ${tobaccos.length} tobaccos for brand ${brand.name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(
          `Failed to scrape tobaccos for brand ${brand.name}: ${errorMessage}`
        );
        metrics.errors++;
        metrics.failedUrls.push(brand.htreviewsUrl);
      }
    }

    // Step 4: Process tobaccos by brand
    logger.info('Step 4: Processing tobaccos');

    // Group tobaccos by brand ID
    const tobaccosByBrand = new Map<number, ScrapedTobacco[]>();
    for (const { tobacco, brandId } of allTobaccos) {
      if (!tobaccosByBrand.has(brandId)) {
        tobaccosByBrand.set(brandId, []);
      }
      tobaccosByBrand.get(brandId)!.push(tobacco);
    }

    // Process each brand's tobaccos
    for (const [brandId, tobaccos] of tobaccosByBrand.entries()) {
      try {
        const result = await processTobaccos(tobaccos, brandId);
        metrics.tobaccosAdded += result.added;
        metrics.tobaccosUpdated += result.updated;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(
          `Failed to process tobaccos for brand ID ${brandId}: ${errorMessage}`
        );
        metrics.errors++;
      }
    }

    logger.info(`Processed ${allTobaccos.length} total tobaccos`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Scraper process failed: ${errorMessage}`);
    metrics.errors++;
    throw error;
  } finally {
    // Cleanup
    if (browser && context) {
      await cleanupBrowser(browser, context);
    }

    // Disconnect from database
    await database.disconnectDatabase();

    // Calculate duration
    metrics.duration = Date.now() - startTime;

    // Log summary
    logMetrics(metrics);
  }

  return metrics;
}

/**
 * Log scraping metrics summary
 * @param metrics - ScrapeMetrics object to log
 */
function logMetrics(metrics: ScrapeMetrics): void {
  logger.info('='.repeat(50));
  logger.info('SCRAPER SUMMARY');
  logger.info('='.repeat(50));
  logger.info(`Brands Added:        ${metrics.brandsAdded}`);
  logger.info(`Tobaccos Added:      ${metrics.tobaccosAdded}`);
  logger.info(`Tobaccos Updated:    ${metrics.tobaccosUpdated}`);
  logger.info(`Errors:              ${metrics.errors}`);
  logger.info(
    `Duration:            ${metrics.duration}ms (${(metrics.duration / 1000).toFixed(2)}s)`
  );

  if (metrics.failedUrls.length > 0) {
    logger.info(`Failed URLs:         ${metrics.failedUrls.length}`);
    metrics.failedUrls.forEach((url, index) => {
      logger.info(`  ${index + 1}. ${url}`);
    });
  }

  const totalItems =
    metrics.brandsAdded + metrics.tobaccosAdded + metrics.tobaccosUpdated;
  if (totalItems > 0) {
    const successRate = (
      (totalItems / (totalItems + metrics.errors)) *
      100
    ).toFixed(2);
    logger.info(`Success Rate:        ${successRate}%`);
  }

  logger.info('='.repeat(50));
}

/**
 * Run a single scrape operation with error handling
 * @returns Promise resolving to ScrapeMetrics object
 */
export async function runSingleScrape(): Promise<ScrapeMetrics> {
  try {
    return await runScraper();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Scrape operation failed: ${errorMessage}`);
    throw error;
  }
}

export default {
  runScraper,
  runSingleScrape,
  createScrapeConfig,
};
