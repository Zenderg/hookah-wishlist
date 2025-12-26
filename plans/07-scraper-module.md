# Scraper Module

## Overview

The scraper module is responsible for automatically populating the tobacco database by collecting data from htreviews.org. It runs on a daily schedule (via cron job) and incrementally updates the database with new tobacco information, avoiding duplicates.

## Technology Stack

- **Browser Automation**: Playwright 1.40+
- **Scheduling**: node-cron 3+
- **HTTP Requests**: Axios 1+
- **HTML Parsing**: Cheerio (optional, for simpler parsing)
- **Logging**: Winston 3+

## Architecture

```mermaid
graph TB
    subgraph "Scraper Module"
        A[node-cron Scheduler]
        B[Scraper Controller]
        C[Brand Scraper]
        D[Tobacco Scraper]
        E[Data Parser]
        F[Database Writer]
    end
    
    subgraph "External"
        G[htreviews.org]
    end
    
    subgraph "Database"
        H[PostgreSQL]
    end
    
    A --> B
    B --> C
    B --> D
    C --> G
    D --> G
    C --> E
    D --> E
    E --> F
    F --> H
    
    style A fill:#e03535
    style B fill:#e03535
    style C fill:#e03535
    style D fill:#e03535
    style E fill:#e03535
    style F fill:#e03535
    style G fill:#ff6b6b
    style H fill:#336791
```

## Target Website Structure

### Main Pages

1. **Brands List**: `https://htreviews.org/tobaccos/brands`
   - Contains all tobacco brands
   - Each brand links to its page

2. **Brand Page**: `https://htreviews.org/tobaccos/{brand-slug}`
   - Lists all tobaccos for a brand
   - Each tobacco links to its detail page

3. **Tobacco Detail**: `https://htreviews.org/tobaccos/{brand-slug}/{line-slug}/{tobacco-slug}`
   - Detailed tobacco information
   - Image, description, ratings, etc.

### Example URLs

```
Brands: https://htreviews.org/tobaccos/brands
Brand: https://htreviews.org/tobaccos/sarma
Tobacco: https://htreviews.org/tobaccos/sarma/klassicheskaya/zima
```

## Scraper Components

### 1. Scheduler

Runs the scraper on a daily schedule.

```typescript
// scheduler.ts
import cron from 'node-cron';
import { ScraperController } from './scraper-controller';

const scraperController = new ScraperController();

// Run daily at 2 AM UTC
cron.schedule('0 2 * * *', async () => {
  console.log('Starting daily scrape...');
  try {
    await scraperController.runFullScrape();
    console.log('Scrape completed successfully');
  } catch (error) {
    console.error('Scrape failed:', error);
  }
});

console.log('Scraper scheduler started');
```

### 2. Scraper Controller

Orchestrates the scraping process.

```typescript
// scraper-controller.ts
import { Browser, chromium } from 'playwright';
import { BrandScraper } from './brand-scraper';
import { TobaccoScraper } from './tobacco-scraper';
import { DatabaseWriter } from './database-writer';
import { Logger } from './logger';

export class ScraperController {
  private browser: Browser | null = null;
  private brandScraper: BrandScraper;
  private tobaccoScraper: TobaccoScraper;
  private databaseWriter: DatabaseWriter;
  private logger: Logger;

  constructor() {
    this.brandScraper = new BrandScraper();
    this.tobaccoScraper = new TobaccoScraper();
    this.databaseWriter = new DatabaseWriter();
    this.logger = new Logger('ScraperController');
  }

  async runFullScrape(): Promise<ScrapeResult> {
    const startTime = Date.now();
    const result: ScrapeResult = {
      brandsAdded: 0,
      tobaccosAdded: 0,
      tobaccosUpdated: 0,
      errors: [],
    };

    try {
      // Initialize browser
      this.browser = await chromium.launch({
        headless: true,
      });

      // Scrape brands
      this.logger.info('Scraping brands...');
      const brands = await this.brandScraper.scrapeBrands(this.browser);
      result.brandsAdded = await this.databaseWriter.saveBrands(brands);
      this.logger.info(`Scraped ${brands.length} brands`);

      // Scrape tobaccos for each brand
      for (const brand of brands) {
        this.logger.info(`Scraping tobaccos for brand: ${brand.name}`);
        
        try {
          const tobaccos = await this.tobaccoScraper.scrapeTobaccos(
            this.browser,
            brand
          );
          
          const { added, updated } = await this.databaseWriter.saveTobaccos(
            tobaccos,
            brand.id
          );
          
          result.tobaccosAdded += added;
          result.tobaccosUpdated += updated;
          
          this.logger.info(
            `Brand ${brand.name}: ${added} added, ${updated} updated`
          );
          
          // Rate limiting: wait between brands
          await this.sleep(2000);
        } catch (error) {
          this.logger.error(`Failed to scrape brand ${brand.name}:`, error);
          result.errors.push({
            type: 'brand',
            identifier: brand.slug,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      this.logger.info(`Scrape completed in ${duration}s`);
      
      return result;
    } catch (error) {
      this.logger.error('Scrape failed:', error);
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }

  async scrapeSingleBrand(brandSlug: string): Promise<ScrapeResult> {
    // Implementation for scraping a single brand
    // Useful for manual rescraping or testing
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 3. Brand Scraper

Scrapes the list of brands from htreviews.org.

```typescript
// brand-scraper.ts
import { Browser, Page } from 'playwright';
import { Logger } from './logger';

interface Brand {
  name: string;
  slug: string;
  htreviewsUrl: string;
}

export class BrandScraper {
  private logger: Logger;
  private readonly BRANDS_URL = 'https://htreviews.org/tobaccos/brands';

  constructor() {
    this.logger = new Logger('BrandScraper');
  }

  async scrapeBrands(browser: Browser): Promise<Brand[]> {
    const page = await browser.newPage();
    const brands: Brand[] = [];

    try {
      this.logger.info(`Fetching brands from ${this.BRANDS_URL}`);
      await page.goto(this.BRANDS_URL, { waitUntil: 'networkidle' });

      // Wait for brand list to load
      await page.waitForSelector('.brand-list, .brands-grid', { timeout: 10000 });

      // Extract brand information
      brands.push(...await this.extractBrands(page));

      this.logger.info(`Extracted ${brands.length} brands`);
      return brands;
    } catch (error) {
      this.logger.error('Failed to scrape brands:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  private async extractBrands(page: Page): Promise<Brand[]> {
    const brands: Brand[] = [];

    // Strategy 1: Look for brand cards with links
    const brandCards = await page.$$('.brand-card, .brand-item, a[href*="/tobaccos/"]');
    
    for (const card of brandCards) {
      try {
        const name = await card.textContent();
        const href = await card.getAttribute('href');
        
        if (name && href && href.includes('/tobaccos/')) {
          const slug = this.extractSlug(href);
          if (slug) {
            brands.push({
              name: name.trim(),
              slug,
              htreviewsUrl: `https://htreviews.org${href}`,
            });
          }
        }
      } catch (error) {
        // Skip failed cards
        continue;
      }
    }

    // Strategy 2: If no cards found, try alternative selectors
    if (brands.length === 0) {
      const links = await page.$$eval('a[href*="/tobaccos/"]', (elements) => {
        return elements.map((el) => ({
          text: el.textContent?.trim() || '',
          href: (el as HTMLAnchorElement).href,
        }));
      });

      for (const link of links) {
        const slug = this.extractSlug(link.href);
        if (slug && link.text) {
          brands.push({
            name: link.text,
            slug,
            htreviewsUrl: link.href,
          });
        }
      }
    }

    // Remove duplicates
    const uniqueBrands = brands.filter((brand, index, self) =>
      index === self.findIndex((b) => b.slug === brand.slug)
    );

    return uniqueBrands;
  }

  private extractSlug(href: string): string | null {
    // Extract slug from URL like https://htreviews.org/tobaccos/sarma
    const match = href.match(/\/tobaccos\/([^\/]+)/);
    return match ? match[1] : null;
  }
}
```

### 4. Tobacco Scraper

Scrapes tobacco details for a specific brand.

```typescript
// tobacco-scraper.ts
import { Browser, Page } from 'playwright';
import { Logger } from './logger';
import { Brand } from './brand-scraper';

interface Tobacco {
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  htreviewsUrl: string;
  metadata: Record<string, any>;
}

export class TobaccoScraper {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('TobaccoScraper');
  }

  async scrapeTobaccos(browser: Browser, brand: Brand): Promise<Tobacco[]> {
    const page = await browser.newPage();
    const tobaccos: Tobacco[] = [];

    try {
      this.logger.info(`Fetching tobaccos from ${brand.htreviewsUrl}`);
      await page.goto(brand.htreviewsUrl, { waitUntil: 'networkidle' });

      // Wait for tobacco list to load
      await page.waitForSelector('.tobacco-list, .tobacco-grid', { timeout: 10000 });

      // Extract tobacco links
      const tobaccoLinks = await this.extractTobaccoLinks(page, brand);

      this.logger.info(`Found ${tobaccoLinks.length} tobacco links`);

      // Scrape each tobacco detail page
      for (const link of tobaccoLinks) {
        try {
          const tobacco = await this.scrapeTobaccoDetail(page, link);
          if (tobacco) {
            tobaccos.push(tobacco);
          }

          // Rate limiting: wait between tobaccos
          await this.sleep(1000);
        } catch (error) {
          this.logger.error(`Failed to scrape tobacco ${link.url}:`, error);
          continue;
        }
      }

      return tobaccos;
    } catch (error) {
      this.logger.error(`Failed to scrape tobaccos for brand ${brand.name}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  private async extractTobaccoLinks(
    page: Page,
    brand: Brand
  ): Promise<Array<{ name: string; url: string; slug: string }>> {
    const links: Array<{ name: string; url: string; slug: string }> = [];

    // Look for tobacco cards or links
    const tobaccoCards = await page.$$('.tobacco-card, .tobacco-item, a[href*="/tobaccos/"]');

    for (const card of tobaccoCards) {
      try {
        const name = await card.textContent();
        const href = await card.getAttribute('href');
        
        if (name && href && href.includes('/tobaccos/')) {
          // Skip brand pages
          if (href.split('/').filter(Boolean).length <= 3) continue;

          links.push({
            name: name.trim(),
            url: `https://htreviews.org${href}`,
            slug: this.extractSlug(href),
          });
        }
      } catch (error) {
        continue;
      }
    }

    return links;
  }

  private async scrapeTobaccoDetail(
    page: Page,
    link: { name: string; url: string; slug: string }
  ): Promise<Tobacco | null> {
    try {
      await page.goto(link.url, { waitUntil: 'networkidle' });

      // Wait for content to load
      await page.waitForSelector('.tobacco-detail, .product-detail', { timeout: 10000 });

      // Extract tobacco information
      const tobacco: Tobacco = {
        name: link.name,
        slug: link.slug,
        description: await this.extractDescription(page),
        imageUrl: await this.extractImageUrl(page),
        htreviewsUrl: link.url,
        metadata: await this.extractMetadata(page),
      };

      return tobacco;
    } catch (error) {
      this.logger.error(`Failed to scrape tobacco detail ${link.url}:`, error);
      return null;
    }
  }

  private async extractDescription(page: Page): Promise<string | null> {
    try {
      const description = await page.$eval(
        '.description, .tobacco-description, .product-description',
        (el) => el.textContent?.trim() || null
      );
      return description;
    } catch {
      return null;
    }
  }

  private async extractImageUrl(page: Page): Promise<string | null> {
    try {
      const imageUrl = await page.$eval(
        '.tobacco-image img, .product-image img, .main-image img',
        (img) => (img as HTMLImageElement).src || null
      );
      return imageUrl;
    } catch {
      return null;
    }
  }

  private async extractMetadata(page: Page): Promise<Record<string, any>> {
    const metadata: Record<string, any> = {};

    try {
      // Extract strength
      const strength = await page.$eval(
        '.strength, .tobacco-strength',
        (el) => el.textContent?.trim()
      );
      if (strength) metadata.strength = strength;

      // Extract cut
      const cut = await page.$eval('.cut, .tobacco-cut', (el) => el.textContent?.trim());
      if (cut) metadata.cut = cut;

      // Extract rating
      const rating = await page.$eval('.rating, .tobacco-rating', (el) => {
        const text = el.textContent?.trim();
        const match = text?.match(/(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : null;
      });
      if (rating) metadata.rating = rating;

      // Extract flavor profile
      const flavors = await page.$$eval('.flavor, .tobacco-flavor', (elements) => {
        return elements.map((el) => el.textContent?.trim()).filter(Boolean);
      });
      if (flavors.length > 0) metadata.flavorProfile = flavors;

      // Extract review count
      const reviewCount = await page.$eval('.reviews-count', (el) => {
        const text = el.textContent?.trim();
        const match = text?.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      });
      if (reviewCount) metadata.reviewsCount = reviewCount;
    } catch (error) {
      // Metadata extraction is optional, don't fail on errors
    }

    return metadata;
  }

  private extractSlug(href: string): string {
    // Extract slug from URL like https://htreviews.org/tobaccos/sarma/klassicheskaya/zima
    const parts = href.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 5. Database Writer

Saves scraped data to the database, avoiding duplicates.

```typescript
// database-writer.ts
import { PrismaClient } from '@prisma/client';
import { Brand } from './brand-scraper';
import { Tobacco } from './tobacco-scraper';
import { Logger } from './logger';

export class DatabaseWriter {
  private prisma: PrismaClient;
  private logger: Logger;

  constructor() {
    this.prisma = new PrismaClient();
    this.logger = new Logger('DatabaseWriter');
  }

  async saveBrands(brands: Brand[]): Promise<number> {
    let added = 0;

    for (const brand of brands) {
      try {
        // Check if brand already exists
        const existing = await this.prisma.brand.findUnique({
          where: { slug: brand.slug },
        });

        if (!existing) {
          await this.prisma.brand.create({
            data: {
              name: brand.name,
              slug: brand.slug,
              htreviewsUrl: brand.htreviewsUrl,
            },
          });
          added++;
          this.logger.debug(`Added brand: ${brand.name}`);
        } else {
          // Update htreviewsUrl if changed
          if (existing.htreviewsUrl !== brand.htreviewsUrl) {
            await this.prisma.brand.update({
              where: { id: existing.id },
              data: { htreviewsUrl: brand.htreviewsUrl },
            });
          }
        }
      } catch (error) {
        this.logger.error(`Failed to save brand ${brand.name}:`, error);
      }
    }

    return added;
  }

  async saveTobaccos(
    tobaccos: Tobacco[],
    brandId: number
  ): Promise<{ added: number; updated: number }> {
    let added = 0;
    let updated = 0;

    for (const tobacco of tobaccos) {
      try {
        // Check if tobacco already exists
        const existing = await this.prisma.tobacco.findUnique({
          where: {
            brandId_slug: {
              brandId,
              slug: tobacco.slug,
            },
          },
        });

        if (!existing) {
          await this.prisma.tobacco.create({
            data: {
              name: tobacco.name,
              slug: tobacco.slug,
              description: tobacco.description,
              imageUrl: tobacco.imageUrl,
              brandId,
              htreviewsUrl: tobacco.htreviewsUrl,
              metadata: tobacco.metadata,
              scrapedAt: new Date(),
            },
          });
          added++;
          this.logger.debug(`Added tobacco: ${tobacco.name}`);
        } else {
          // Update existing tobacco
          await this.prisma.tobacco.update({
            where: { id: existing.id },
            data: {
              description: tobacco.description,
              imageUrl: tobacco.imageUrl,
              htreviewsUrl: tobacco.htreviewsUrl,
              metadata: tobacco.metadata,
              scrapedAt: new Date(),
            },
          });
          updated++;
          this.logger.debug(`Updated tobacco: ${tobacco.name}`);
        }
      } catch (error) {
        this.logger.error(`Failed to save tobacco ${tobacco.name}:`, error);
      }
    }

    return { added, updated };
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
```

### 6. Logger

Centralized logging for the scraper.

```typescript
// logger.ts
import winston from 'winston';

export class Logger {
  private logger: winston.Logger;

  constructor(context: string) {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { context },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              return `${timestamp} [${context}] ${level}: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta) : ''
              }`;
            })
          ),
        }),
        new winston.transports.File({
          filename: 'logs/scraper-error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/scraper-combined.log',
        }),
      ],
    });
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, error?: any): void {
    this.logger.error(message, { error: error?.message || error, stack: error?.stack });
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }
}
```

## Scheduling

### Cron Schedule

The scraper runs daily at 2 AM UTC to minimize impact on the target website and database.

```typescript
// Run daily at 2 AM UTC
cron.schedule('0 2 * * *', async () => {
  // Scrape logic
});
```

### Alternative Schedules

```typescript
// Run every 6 hours
cron.schedule('0 */6 * * *', async () => {
  // Scrape logic
});

// Run weekly on Sunday at 3 AM
cron.schedule('0 3 * * 0', async () => {
  // Scrape logic
});
```

## Error Handling

### Retry Logic

```typescript
async function scrapeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 5000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Error Recovery

- Skip failed brands/tobaccos and continue with others
- Log all errors for later review
- Send alert if error rate exceeds threshold
- Maintain list of failed URLs for manual review

## Rate Limiting

### Delays Between Requests

```typescript
// Wait between brands
await this.sleep(2000);

// Wait between tobaccos
await this.sleep(1000);
```

### Respect robots.txt

```typescript
async function checkRobotsTxt(url: string): Promise<boolean> {
  try {
    const robotsUrl = new URL('/robots.txt', url).toString();
    const response = await axios.get(robotsUrl);
    // Parse robots.txt and check if scraping is allowed
    return true; // Simplified
  } catch {
    return true; // Allow if robots.txt not found
  }
}
```

## Configuration

### Environment Variables

```env
# Scraper Configuration
SCRAPER_SCHEDULE="0 2 * * *"
SCRAPER_TIMEOUT=60000
SCRAPER_MAX_RETRIES=3
SCRAPER_DELAY_BRAND=2000
SCRAPER_DELAY_TOBACCO=1000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hookah_wishlist"

# Logging
LOG_LEVEL=info
LOG_DIR=logs
```

### Configuration File

```typescript
// config.ts
export const config = {
  scraper: {
    schedule: process.env.SCRAPER_SCHEDULE || '0 2 * * *',
    timeout: parseInt(process.env.SCRAPER_TIMEOUT || '60000', 10),
    maxRetries: parseInt(process.env.SCRAPER_MAX_RETRIES || '3', 10),
    delay: {
      brand: parseInt(process.env.SCRAPER_DELAY_BRAND || '2000', 10),
      tobacco: parseInt(process.env.SCRAPER_DELAY_TOBACCO || '1000', 10),
    },
  },
  target: {
    baseUrl: 'https://htreviews.org',
    brandsUrl: 'https://htreviews.org/tobaccos/brands',
  },
};
```

## Monitoring

### Metrics to Track

- Brands scraped
- Tobaccos added
- Tobaccos updated
- Errors encountered
- Scrape duration
- Success rate

### Logging

```typescript
// Log scrape summary
this.logger.info('Scrape completed', {
  duration: `${duration}s`,
  brandsAdded: result.brandsAdded,
  tobaccosAdded: result.tobaccosAdded,
  tobaccosUpdated: result.tobaccosUpdated,
  errors: result.errors.length,
});
```

### Health Check

```typescript
// health-check.ts
export async function healthCheck(): Promise<HealthStatus> {
  const lastScrape = await getLastScrapeTimestamp();
  const isHealthy = Date.now() - lastScrape < 48 * 60 * 60 * 1000; // 48 hours

  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    lastScrape,
    uptime: process.uptime(),
  };
}
```

## Testing

### Unit Tests

```typescript
// __tests__/brand-scraper.test.ts
import { BrandScraper } from '../brand-scraper';

describe('BrandScraper', () => {
  it('should extract brand slug from URL', () => {
    const scraper = new BrandScraper();
    const slug = scraper['extractSlug']('https://htreviews.org/tobaccos/sarma');
    expect(slug).toBe('sarma');
  });
});
```

### Integration Tests

```typescript
// __tests__/scraper-integration.test.ts
import { ScraperController } from '../scraper-controller';

describe('Scraper Integration', () => {
  it('should scrape a single brand', async () => {
    const controller = new ScraperController();
    const result = await controller.scrapeSingleBrand('sarma');
    
    expect(result.tobaccosAdded).toBeGreaterThan(0);
  }, 30000);
});
```

## Deployment

### Process Management

```bash
# Run scraper
npm run scraper

# Run with PM2
pm2 start dist/scraper/index.js --name hookah-scraper
pm2 logs hookah-scraper
pm2 restart hookah-scraper
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

CMD ["node", "dist/scraper/index.js"]
```

## Security Considerations

1. **User Agent**: Use a descriptive user agent
2. **Rate Limiting**: Respect the target website's limits
3. **Error Handling**: Don't expose sensitive information in logs
4. **Environment Variables**: Store sensitive data in environment variables
5. **Access Control**: Restrict scraper to internal network if possible

## Summary

The scraper module provides:

✅ **Automated data collection** - Daily updates from htreviews.org
✅ **Incremental updates** - Only adds new records, updates existing ones
✅ **Error handling** - Robust error handling and retry logic
✅ **Rate limiting** - Respects target website's limits
✅ **Logging** - Comprehensive logging for monitoring
✅ **Scheduling** - Configurable cron-based scheduling
✅ **Testing** - Unit and integration tests
✅ **Monitoring** - Health checks and metrics

The scraper ensures the tobacco database stays up-to-date with minimal manual intervention.
