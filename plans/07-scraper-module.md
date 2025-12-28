# Scraper Module

## Overview

The scraper module is responsible for automatically populating tobacco database by collecting data from htreviews.org. It runs on a daily schedule (via node-cron) and incrementally updates database with new tobacco information, avoiding duplicates. The scraper runs in a Docker container and connects to PostgreSQL via Docker network. **This module is fully implemented** with complete scraping logic, error handling, and database integration.

## Technology Stack

- **Browser Automation**: Playwright 1.57+
- **Scheduling**: node-cron 4+
- **HTTP Requests**: Axios 1+
- **Logging**: Winston 3+
- **Database**: Prisma 7.2.0+ (centralized, shared with API)

## Architecture

```mermaid
graph TB
    subgraph "Scraper Module"
        A[node-cron Scheduler]
        B[Scraper Controller]
        C[Brand Scraper]
        D[Tobacco Scraper]
        E[Database Service]
        F[Logger]
    end
    
    subgraph "External"
        G[htreviews.org]
    end
    
    subgraph "Database"
        H[PostgreSQL]
    end
    
    subgraph "Shared Resources"
        I[Centralized Prisma]
        J[pnpm Workspace]
    end
    
    A --> B
    B --> C
    B --> D
    B --> E
    C --> G
    D --> G
    E --> I
    I --> H
    B --> F
    C --> F
    D --> F
    E --> F
    J --> I
    
    style A fill:#e03535
    style B fill:#e03535
    style C fill:#e03535
    style D fill:#e03535
    style E fill:#e03535
    style F fill:#e03535
    style G fill:#ff6b6b
    style H fill:#336791
    style I fill:#336791
    style J fill:#f6921e
```

## Target Website Structure

### Main Pages

1. **Brands List**: `https://htreviews.org/tobaccos/brands?r=position&s=rating&d=desc`
   - Contains all tobacco brands
   - Content loads incrementally as user scrolls down (infinite scroll)
   - Query parameters control sorting and pagination
   - Each brand links to its detail page

2. **Brand Page**: `https://htreviews.org/tobaccos/{brand-slug}?r=position&s=rating&d=desc`
   - Shows brand description and details
   - Lists all tobaccos for a brand
   - Lists all lines (линейки) for a brand (for reference only)
   - Content loads incrementally as user scrolls down (infinite scroll)
   - Each tobacco links to its detail page

3. **Tobacco Detail**: `https://htreviews.org/tobaccos/{brand-slug}/{line-slug}/{tobacco-slug}?r=position&s=created&d=desc`
   - Detailed tobacco information
   - Image, description, ratings, etc.
   - **Note**: Lines (линейки) are only used for URL structure, not stored in database

### Important Notes

- **Lines (Линейки)**: Lines are part of the URL structure but should NOT be scraped or stored in the database. They are only used to construct tobacco detail URLs.
- **Infinite Scroll**: Both brands list and brand pages use infinite scroll - content loads as user scrolls down
- **Query Parameters**: URLs include query parameters for sorting and pagination (e.g., `?r=position&s=rating&d=desc`)

### Example URLs

```
# Brands List (with sorting parameters)
Brands: https://htreviews.org/tobaccos/brands?r=position&s=rating&d=desc

# Brand Page (with sorting parameters)
Brand: https://htreviews.org/tobaccos/dogma?r=position&s=rating&d=desc

# Tobacco Detail (with sorting parameters)
Tobacco: https://htreviews.org/tobaccos/dogma/sigarnyy-monosort/san-andres?r=position&s=created&d=desc
```

**URL Structure Breakdown**:
- `dogma` - brand slug
- `sigarnyy-monosort` - line slug (for URL structure only, not stored)
- `san-andres` - tobacco slug

## Implemented Components

### 1. Scheduler ([`scraper/src/index.ts`](../scraper/src/index.ts:1))

**Status**: ✅ Fully Implemented

Runs scraper on a daily schedule and handles graceful shutdown.

**Key Features**:
- Configurable cron schedule via `SCRAPER_SCHEDULE` environment variable
- Initial scrape on startup for immediate data population
- Graceful shutdown handling (SIGTERM, SIGINT)
- Error handling with logging
- Database connection management
- Metrics logging (duration, brands added, tobaccos added/updated, errors)

**Schedule Configuration**:
```typescript
const SCRAPER_SCHEDULE = process.env.SCRAPER_SCHEDULE || '0 2 * * *';
```

**Default Schedule**: Daily at 2 AM UTC

### 2. Scraper Controller ([`scraper/src/scrapers/scraperController.ts`](../scraper/src/scrapers/scraperController.ts:1))

**Status**: ✅ Fully Implemented

Orchestrates the complete scraping process with proper error handling and metrics tracking.

**Key Features**:
- Playwright browser initialization and cleanup
- Configuration from environment variables
- Step-by-step scraping process (brands → tobaccos)
- Database operations via centralized Prisma
- Metrics tracking (brands added, tobaccos added/updated, errors, duration)
- Error handling with exponential backoff
- Logging at each step

**Scraping Process**:
1. Initialize Playwright browser
2. Scrape brands list with infinite scroll
3. Process and save brands to database
4. For each brand, scrape tobaccos with infinite scroll
5. Process and save tobaccos to database
6. Log metrics summary
7. Cleanup resources

### 3. Brand Scraper ([`scraper/src/scrapers/brandScraper.ts`](../scraper/src/scrapers/brandScraper.ts:1))

**Status**: ✅ Fully Implemented

Scrapes brand list and details from htreviews.org with multiple extraction strategies.

**Key Features**:
- Multiple extraction strategies for robustness
- Infinite scroll handling for dynamic content
- Retry logic with exponential backoff
- Brand deduplication
- URL parsing and slug extraction
- Text cleaning and normalization

**Extraction Strategies**:
1. **Strategy 1**: Look for brand cards with specific classes
2. **Strategy 2**: Look for all links with brand URLs
3. **Strategy 3**: Look for brand names in text and construct URLs
4. **Strategy 4**: Look for embedded JSON data in script tags

**Functions**:
- `scrapeBrands()` - Scrapes all brands with infinite scroll
- `scrapeBrandPage()` - Scrapes single brand page for additional data
- `deduplicateBrands()` - Removes duplicate brands based on slug

**Infinite Scroll Implementation**:
```typescript
while (scrollAttempts < maxScrollAttempts) {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await sleep(2000);
  const currentBrands = await extractBrands(page);
  if (currentBrands.length === previousCount) {
    break; // No new brands found
  }
  previousCount = currentBrands.length;
  scrollAttempts++;
}
```

### 4. Tobacco Scraper ([`scraper/src/scrapers/tobaccoScraper.ts`](../scraper/src/scrapers/tobaccoScraper.ts:1))

**Status**: ✅ Fully Implemented

Scrapes tobacco details for brands with multiple extraction strategies and infinite scroll.

**Key Features**:
- Multiple extraction strategies for robustness
- Infinite scroll handling for dynamic content
- Retry logic with exponential backoff
- Tobacco deduplication
- URL parsing and slug extraction
- Metadata extraction (strength, cut, flavor profile, rating, reviews count)
- Rate limiting between requests

**Extraction Strategies**:
1. **Strategy 1**: Look for all tobacco links matching URL pattern
2. **Strategy 2**: Look for tobacco cards with specific classes
3. **Strategy 3**: Look for embedded JSON data in script tags

**Functions**:
- `scrapeTobaccoPage()` - Scrapes single tobacco detail page
- `scrapeBrandTobaccos()` - Scrapes all tobaccos for a brand with infinite scroll
- `scrapeAllTobaccos()` - Scrapes tobaccos for multiple brands
- `delay()` / `sleep()` - Rate limiting delays

**Metadata Extracted**:
- Name
- Description
- Image URL
- Strength
- Cut
- Flavor profile
- Rating
- Reviews count

**Infinite Scroll Implementation**:
```typescript
while (scrollAttempts < maxScrollAttempts) {
  if (limit && currentLinks.length >= limit) {
    break; // Reached limit
  }
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await sleep(2000);
  const currentLinks = await extractLinksFromPage(page);
  if (currentLinks.length === previousCount) {
    break; // No new links found
  }
  previousCount = currentLinks.length;
  scrollAttempts++;
}
```

### 5. Database Service ([`scraper/src/services/database.ts`](../scraper/src/services/database.ts:1))

**Status**: ✅ Fully Implemented

Handles all database operations using centralized Prisma Client.

**Key Features**:
- Singleton Prisma Client pattern
- PostgreSQL connection pool management
- Upsert operations (create or update)
- Brand and tobacco CRUD operations
- Connection testing
- Graceful disconnection
- Error handling with logging

**Functions**:
- `getPrismaClient()` - Returns singleton Prisma Client instance
- `testConnection()` - Tests database connection
- `disconnectDatabase()` - Disconnects from database
- `upsertBrand()` - Creates or updates brand
- `upsertTobacco()` - Creates or updates tobacco
- `getBrandBySlug()` - Retrieves brand by slug
- `getAllBrands()` - Retrieves all brands
- `getTobaccoCount()` - Counts tobaccos for a brand

**Upsert Logic**:
```typescript
export async function upsertBrand(brand: ScrapedBrand): Promise<BrandUpsertResult> {
  const existingBrand = await client.brand.findUnique({
    where: { slug: brand.slug },
  });

  if (existingBrand) {
    // Update existing brand
    const updatedBrand = await client.brand.update({
      where: { slug: brand.slug },
      data: { /* updated fields */ },
    });
    return { success: true, brandId: updatedBrand.id, isNew: false };
  } else {
    // Create new brand
    const newBrand = await client.brand.create({
      data: { /* brand fields */ },
    });
    return { success: true, brandId: newBrand.id, isNew: true };
  }
}
```

### 6. Logger ([`scraper/src/config/logger.ts`](../scraper/src/config/logger.ts:1))

**Status**: ✅ Fully Implemented

Centralized logging for scraper using Winston.

**Key Features**:
- Multiple log levels (error, warn, info, debug)
- Structured logging with JSON format
- Console transport with colorization
- Context-aware logging
- Timestamp and metadata support

## Scheduling

### Cron Schedule

The scraper runs daily at 2 AM UTC to minimize impact on target website and database.

```typescript
// Default schedule
const SCRAPER_SCHEDULE = '0 2 * * *';

// Schedule task
cron.schedule(SCRAPER_SCHEDULE, async () => {
  await runScraper();
});
```

### Alternative Schedules

```typescript
// Run every 6 hours
const SCRAPER_SCHEDULE = '0 */6 * * *';

// Run weekly on Sunday at 3 AM
const SCRAPER_SCHEDULE = '0 3 * * 0';
```

### Initial Scrape

The scraper runs once on startup to populate initial data:

```typescript
// Run initial scrape on startup
logger.info('Running initial scraper on startup...');
try {
  await runScraper();
} catch (error) {
  logger.error(`Initial scraper run failed: ${error}`);
  // Don't exit, let scheduled runs continue
}
```

## Error Handling

### Retry Logic with Exponential Backoff

Implemented across all scraping operations:

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delayMs: number
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const backoffDelay = delayMs * Math.pow(2, attempt);
      logger.warn(`Attempt ${attempt + 1} failed. Retrying in ${backoffDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  throw error;
}
```

### Error Recovery

- Skip failed brands/tobaccos and continue with others
- Log all errors for later review
- Track failed URLs in metrics
- Continue processing even if some items fail
- Multiple extraction strategies for robustness

## Rate Limiting

### Delays Between Requests

Configurable via environment variables:

```typescript
const config = {
  delayBrand: parseInt(process.env.SCRAPER_DELAY_BRAND || '2000', 10),
  delayTobacco: parseInt(process.env.SCRAPER_DELAY_TOBACCO || '1000', 10),
};
```

**Default Delays**:
- Between brands: 2000ms (2 seconds)
- Between tobaccos: 1000ms (1 second)
- During infinite scroll: 2000ms

## Configuration

### Environment Variables

```env
# Scraper Configuration
SCRAPER_SCHEDULE="0 2 * * *"
SCRAPER_TIMEOUT=60000
SCRAPER_MAX_RETRIES=3
SCRAPER_DELAY_BRAND=2000
SCRAPER_DELAY_TOBACCO=1000

# Database (uses centralized Prisma)
DATABASE_URL="postgresql://hookah_user:hookah_password@postgres:5432/hookah_wishlist"

# Logging
LOG_LEVEL=info
```

### Configuration File

Created dynamically from environment variables:

```typescript
export function createScrapeConfig(): ScrapeConfig {
  return {
    timeout: parseInt(process.env.SCRAPER_TIMEOUT || '60000', 10),
    maxRetries: parseInt(process.env.SCRAPER_MAX_RETRIES || '3', 10),
    delayBrand: parseInt(process.env.SCRAPER_DELAY_BRAND || '2000', 10),
    delayTobacco: parseInt(process.env.SCRAPER_DELAY_TOBACCO || '1000', 10),
  };
}
```

## Monitoring

### Metrics Tracked

The scraper tracks and logs comprehensive metrics:

```typescript
interface ScrapeMetrics {
  brandsAdded: number;      // Number of new brands added
  tobaccosAdded: number;    // Number of new tobaccos added
  tobaccosUpdated: number;   // Number of existing tobaccos updated
  errors: number;            // Number of errors encountered
  duration: number;          // Total scrape duration in milliseconds
  failedUrls: string[];     // List of URLs that failed to scrape
}
```

### Logging

**Scrape Start**:
```
==================================================
SCRAPER STARTED
==================================================
Environment: development
Log Level: info
Cron Schedule: 0 2 * * *
==================================================
```

**Scrape Progress**:
```
Step 1: Scraping brands
Starting brand scrape from https://htreviews.org/tobaccos/brands?r=position&s=rating&d=desc
Initial extraction: 50 brands
Scroll 1: Found 50 total brands
Scroll 2: Found 75 total brands
No new brands found after 2 scrolls
Successfully extracted 75 unique brands with infinite scroll
Processing 75 brands
Brand processing complete. Added: 75
```

**Scrape Summary**:
```
==================================================
SCRAPER SUMMARY
==================================================
Brands Added:        75
Tobaccos Added:      1500
Tobaccos Updated:    50
Errors:              2
Duration:            120000ms (120.00s)
Failed URLs:         2
  1. https://htreviews.org/tobaccos/brand1
  2. https://htreviews.org/tobaccos/brand2
Success Rate:        99.87%
==================================================
```

## Deployment

### Docker Configuration

```dockerfile
# scraper/Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Environment Variables

```env
# Scraper Configuration
SCRAPER_SCHEDULE="0 2 * * *"
SCRAPER_TIMEOUT=60000
SCRAPER_MAX_RETRIES=3
SCRAPER_DELAY_BRAND=2000
SCRAPER_DELAY_TOBACCO=1000

# Database (uses centralized Prisma)
DATABASE_URL="postgresql://hookah_user:secure_password@postgres:5432/hookah_wishlist"

# Logging
LOG_LEVEL=info
```

### Coolify Deployment

- Scraper runs as a Docker Compose service
- Environment variables managed in Coolify dashboard
- Automatic scaling and health monitoring
- Logs aggregated in Coolify dashboard
- Uses same Prisma schema as API (centralized)

## Security Considerations

1. **User Agent**: Uses descriptive user agent for Playwright
2. **Rate Limiting**: Respects target website's limits with configurable delays
3. **Error Handling**: Doesn't expose sensitive information in logs
4. **Environment Variables**: Stores sensitive data in environment variables
5. **Access Control**: Scraper runs in isolated Docker container
6. **Database Security**: Uses centralized Prisma with connection pooling

## Important Implementation Notes

### Infinite Scroll Handling

Both brands list and brand pages use infinite scroll. The scraper implements:

1. **Initial Load**: Wait for initial content to load
2. **Scroll Down**: Programmatically scroll to bottom of page
3. **Wait**: Wait for new content to load (2 seconds)
4. **Extract**: Extract new items from page
5. **Repeat**: Continue until no new items appear
6. **Deduplicate**: Remove duplicate items before adding to list
7. **Limit Check**: Stop if limit reached (optional)

### URL Structure

- **Brands**: `https://htreviews.org/tobaccos/brands?r=position&s=rating&d=desc`
- **Brand**: `https://htreviews.org/tobaccos/{brand-slug}?r=position&s=rating&d=desc`
- **Tobacco Detail**: `https://htreviews.org/tobaccos/{brand-slug}/{line-slug}/{tobacco-slug}?r=position&s=created&d=desc`

**Note**: Line slug (линейка) is only used for URL structure and should NOT be stored in the database.

### Data to Store

**Store in Database**:
- ✅ Brands (name, slug, description, imageUrl, htreviewsUrl)
- ✅ Tobaccos (name, slug, description, imageUrl, htreviewsUrl, metadata, scrapedAt)

**Do NOT Store**:
- ❌ Lines (линейки) - only used for URL structure
- ❌ Line descriptions - only for reference on brand pages

### Multiple Extraction Strategies

The scraper uses multiple extraction strategies to ensure robustness:

1. **DOM-based extraction**: Look for specific CSS selectors
2. **Link-based extraction**: Parse all links matching URL patterns
3. **Text-based extraction**: Look for brand/tobacco names in text
4. **JSON-based extraction**: Parse embedded JSON-LD data

This ensures the scraper works even if the website structure changes.

## Testing

### Manual Scraper Run

Run scraper manually for testing:

```bash
cd scraper
pnpm run test
```

### Test Connection

Test database connection:

```bash
cd scraper
node -e "import('./dist/services/database.js').then(m => m.testConnection())"
```

## Summary

The scraper module provides:

✅ **Automated data collection** - Daily updates from htreviews.org
✅ **Infinite scroll support** - Handles dynamically loaded content on brands and tobacco lists
✅ **Incremental updates** - Only adds new records, updates existing ones
✅ **Error handling** - Robust error handling with exponential backoff retry
✅ **Rate limiting** - Respects target website's limits with configurable delays
✅ **Logging** - Comprehensive logging for monitoring with Winston
✅ **Scheduling** - Configurable cron-based scheduling with node-cron
✅ **Containerized** - Runs in Docker container
✅ **Coolify deployment** - Automated deployment and management
✅ **Docker network** - Connects to PostgreSQL via Docker network
✅ **Correct URL structure** - Uses proper URLs with sorting parameters
✅ **No line storage** - Lines only used for URL construction, not stored in database
✅ **Multiple extraction strategies** - Robust scraping with fallback strategies
✅ **Metrics tracking** - Comprehensive metrics logging (brands, tobaccos, errors, duration)
✅ **Centralized Prisma** - Uses same Prisma schema and client as API
✅ **Fully Implemented** - All components (scheduler, controller, brand scraper, tobacco scraper, database service) are complete and functional

The scraper ensures tobacco database stays up-to-date with minimal manual intervention, using robust scraping techniques and centralized database management.
