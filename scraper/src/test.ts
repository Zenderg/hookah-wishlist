import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from parent directory (project root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import logger from './config/logger.js';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { scrapeBrandPage } from './scrapers/brandScraper.js';
import { scrapeBrandTobaccos } from './scrapers/tobaccoScraper.js';
import * as database from './services/database.js';
import type { ScrapeConfig } from './types/index.js';

/**
 * Create scraper configuration from environment variables
 */
function createScrapeConfig(): ScrapeConfig {
  return {
    timeout: parseInt(process.env.SCRAPER_TIMEOUT || '60000', 10),
    maxRetries: parseInt(process.env.SCRAPER_MAX_RETRIES || '3', 10),
    delayBrand: parseInt(process.env.SCRAPER_DELAY_BRAND || '2000', 10),
    delayTobacco: parseInt(process.env.SCRAPER_DELAY_TOBACCO || '1000', 10),
  };
}

/**
 * Initialize Playwright browser
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
  page.setDefaultTimeout(parseInt(process.env.SCRAPER_TIMEOUT || '60000', 10));

  logger.info('Playwright browser initialized successfully');
  return { browser, context, page };
}

/**
 * Close browser and cleanup
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
 * Scrape a single brand by slug
 */
async function scrapeSingleBrand(brandSlug: string): Promise<void> {
  const config = createScrapeConfig();
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    // Initialize database connection
    await database.testConnection();

    // Initialize browser
    const browserSetup = await initializeBrowser();
    browser = browserSetup.browser;
    context = browserSetup.context;
    page = browserSetup.page;

    // Construct brand URL directly
    const brandUrl = `https://htreviews.org/tobaccos/${brandSlug}`;
    logger.info(`Scraping brand from URL: ${brandUrl}`);

    // Scrape brand page directly
    const targetBrand = await scrapeBrandPage(page, brandUrl, config);

    if (!targetBrand) {
      logger.error(`Brand ${brandSlug} not found`);
      throw new Error(`Brand ${brandSlug} not found`);
    }

    logger.info(`Found brand: ${targetBrand.name} (${targetBrand.slug})`);

    // Save brand to database
    const brandResult = await database.upsertBrand(targetBrand);
    if (!brandResult.success) {
      throw new Error(`Failed to save brand: ${brandResult.error}`);
    }

    logger.info(`Saved brand: ${targetBrand.name} (ID: ${brandResult.brandId})`);

    // Scrape tobaccos for this brand with limit of 10
    logger.info(`Scraping tobaccos for brand: ${targetBrand.name}`);
    const tobaccos = await scrapeBrandTobaccos(page, targetBrand, config, 10);

    logger.info(`Scraped ${tobaccos.length} tobaccos`);

    // Save tobaccos to database
    let added = 0;
    let updated = 0;

    for (const tobacco of tobaccos) {
      const result = await database.upsertTobacco(brandResult.brandId!, tobacco);
      if (result.success) {
        if (result.isNew) {
          added++;
        } else {
          updated++;
        }
      }
    }

    logger.info(`Saved tobaccos: ${added} added, ${updated} updated`);

    // Verify all required fields are present
    logger.info('Verifying required fields...');

    // Verify brand has required fields
    const brandFromDb = await database.getBrandBySlug(targetBrand.slug);
    if (!brandFromDb) {
      throw new Error('Brand not found in database after save');
    }
    logger.info(`✓ Brand in database: ${brandFromDb.name} (ID: ${brandFromDb.id})`);

    // Verify tobaccos have required fields
    const tobaccoCount = await database.getTobaccoCount(brandResult.brandId!);
    logger.info(`✓ Tobaccos in database: ${tobaccoCount} for brand ${targetBrand.name}`);

    if (tobaccoCount === 0) {
      throw new Error('No tobaccos found in database after save');
    }
  } finally {
    // Cleanup
    if (browser && context) {
      await cleanupBrowser(browser, context);
    }

    // Disconnect from database
    await database.disconnectDatabase();
  }
}

async function runTest() {
  logger.info('Starting scraper test...');

  try {
    // Test: Scrape only 1 brand with limited tobaccos
    logger.info('Test: Scrape single brand (sarma) with max 10 tobaccos');
    await scrapeSingleBrand('sarma');

    logger.info('Test completed successfully!');
    logger.info('Check database for:');
    logger.info('- Brand: Sarma with htreviewsUrl');
    logger.info('- Tobaccos (max 10) with imageUrl, description, htreviewsUrl, and metadata');
  } catch (error) {
    logger.error('Test failed:', error);
    process.exit(1);
  }
}

void runTest();
