import { Page } from 'playwright';
import logger from '../config/logger.js';
import { waitForContent, extractWithStrategies } from '../utils/waitForContent.js';
import type { ScrapedBrand, ScrapeConfig } from '../types/index.js';

/**
 * Base URL for htreviews.org
 */
const BASE_URL = 'https://htreviews.org';

/**
 * Brands URL with query parameters for sorting
 */
const BRANDS_URL = 'https://htreviews.org/tobaccos/brands?r=position&s=rating&d=desc';

/**
 * Clean up text by removing extra whitespace, newlines, and tabs
 * @param text - Text to clean
 * @returns Cleaned text
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace all whitespace (including newlines and tabs) with single space
    .trim(); // Remove leading/trailing whitespace
}

/**
 * Retry a function with exponential backoff
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param delayMs - Initial delay in milliseconds
 * @returns Promise resolving to function result
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delayMs: number
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }

      const backoffDelay = delayMs * Math.pow(2, attempt);
      logger.warn(
        `Attempt ${attempt + 1}/${maxRetries + 1} failed. Retrying in ${backoffDelay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  throw lastError;
}

/**
 * Sleep for specified milliseconds
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Brand extraction strategy 1: Look for brand cards with specific classes
 */
const extractBrandsStrategy1 = () => {
  const results: Array<{ name: string; slug: string; htreviewsUrl: string }> = [];
  const cards = document.querySelectorAll(
    '[class*="card"], [class*="brand"], [class*="item"], [class*="object"]'
  );

  console.log(`[DEBUG] Strategy 1: Found ${cards.length} cards`);

  cards.forEach((card: any) => {
    const link = card.querySelector('a');
    if (link && link.href && link.href.includes('/tobaccos/')) {
      const nameElement =
        card.querySelector('h1, h2, h3, [class*="name"], [class*="title"]') || link;
      const name = nameElement.textContent?.trim();
      if (name) {
        const slug = link.href.split('/tobaccos/').pop()?.split('/')[0] || '';
        results.push({
          name,
          slug,
          htreviewsUrl: link.href,
        });
      }
    }
  });

  console.log(`[DEBUG] Strategy 1: Extracted ${results.length} brands`);
  return results;
};

/**
 * Brand extraction strategy 2: Look for all links with brand URLs
 */
const extractBrandsStrategy2 = () => {
  const results: Array<{ name: string; slug: string; htreviewsUrl: string }> = [];
  const links = document.querySelectorAll('a[href*="/tobaccos/"]');

  console.log(`[DEBUG] Strategy 2: Found ${links.length} brand links`);

  links.forEach((link: any) => {
    const href = link.href;
    const name = link.textContent?.trim();
    if (name && name.length > 2) {
      // Filter out short names
      const slug = href.split('/tobaccos/').pop()?.split('/')[0] || '';
      if (slug && !slug.includes('?')) {
        // Filter out query params
        results.push({
          name,
          slug,
          htreviewsUrl: href,
        });
      }
    }
  });

  console.log(`[DEBUG] Strategy 2: Extracted ${results.length} brands`);
  return results;
};

/**
 * Brand extraction strategy 3: Look for brand names in text and construct URLs
 */
const extractBrandsStrategy3 = () => {
  const results: Array<{ name: string; slug: string; htreviewsUrl: string }> = [];

  try {
    // Look for brand names in page content
    const brandNames = Array.from(
      document.querySelectorAll('h1, h2, h3, [class*="title"], [class*="name"]')
    )
      .map((el: any) => el.textContent?.trim())
      .filter((name: string | undefined) => name && name.length > 2);

    console.log(`[DEBUG] Strategy 3: Found ${brandNames.length} potential brand names`);

    // Common brand slugs to try
    const commonBrands = [
      'dogma',
      'bonche',
      'satyr',
      'kraken',
      'world-tobacco-original',
      'trofimoffs',
      'tangiers',
      'palitra',
      'rustpunk',
      'severnyy',
      'jent',
      'deus',
      'snobless',
      'nash',
      'sarma',
      'sapphire-crown',
      'joy',
      'fake',
      'dusha',
      'darkside',
      'lezzet',
      'dokhaman',
      'total-flame',
      'antagonist',
      'bezdna',
      'reverse',
      'hell',
      'adam-i-eva',
      'cbx',
      'baza',
      'carlivan',
      'al-waha',
      'zapp',
      'sweddishot',
      'brume',
      'layalina',
      'fairytale-mist',
      'sarkozy',
      'kvist',
      'soex',
    ];

    // Try to find matching brands
    brandNames.forEach((name: string) => {
      const lowerName = name.toLowerCase();
      const matchingBrand = commonBrands.find(
        (brand) =>
          lowerName.includes(brand) ||
          brand.includes(lowerName.replace(/\s+/g, '-'))
      );

      if (matchingBrand) {
        results.push({
          name,
          slug: matchingBrand,
          htreviewsUrl: `${BASE_URL}/tobaccos/${matchingBrand}`,
        });
      }
    });
  } catch (error) {
    console.log(`[DEBUG] Strategy 3 error:`, error);
  }

  console.log(`[DEBUG] Strategy 3: Extracted ${results.length} brands`);
  return results;
};

/**
 * Brand extraction strategy 4: Look for embedded JSON data in script tags
 */
const extractBrandsStrategy4 = () => {
  const results: Array<{ name: string; slug: string; htreviewsUrl: string }> = [];

  try {
    const scripts = document.querySelectorAll(
      'script[type="application/json"], script[type="application/ld+json"]'
    );
    console.log(`[DEBUG] Strategy 4: Found ${scripts.length} JSON scripts`);

    scripts.forEach((script: any) => {
      try {
        const data = JSON.parse(script.textContent || '');
        // Try to find brands in JSON structure
        const findBrands = (obj: any): void => {
          if (Array.isArray(obj)) {
            obj.forEach(findBrands);
          } else if (obj && typeof obj === 'object') {
            if (obj.name && obj.slug && obj.htreviewsUrl) {
              results.push({
                name: obj.name,
                slug: obj.slug,
                htreviewsUrl: obj.htreviewsUrl,
              });
            }
            Object.values(obj).forEach(findBrands);
          }
        };
        findBrands(data);
      } catch {
        // Ignore JSON parsing errors
      }
    });
  } catch (error) {
    console.log(`[DEBUG] Strategy 4 error:`, error);
  }

  console.log(`[DEBUG] Strategy 4: Extracted ${results.length} brands`);
  return results;
};

/**
 * Extract brands from page
 * @param page - Playwright Page instance
 * @returns Promise resolving to array of ScrapedBrand objects
 */
async function extractBrands(page: Page): Promise<ScrapedBrand[]> {
  const extractedBrands = await extractWithStrategies(page, [
    extractBrandsStrategy1,
    extractBrandsStrategy2,
    extractBrandsStrategy3,
    extractBrandsStrategy4,
  ]);

  if (!extractedBrands || extractedBrands.length === 0) {
    return [];
  }

  // Normalize and deduplicate brands
  const brands: ScrapedBrand[] = [];
  const seenSlugs = new Set<string>();

  for (const brand of extractedBrands) {
    const slug = brand.slug.toLowerCase();
    const cleanedName = cleanText(brand.name);
    if (!seenSlugs.has(slug) && cleanedName) {
      brands.push({
        name: cleanedName,
        slug,
        description: '', // Will be populated when scraping brand page
        imageUrl: '', // Will be populated when scraping brand page
        htreviewsUrl: brand.htreviewsUrl.startsWith('http')
          ? brand.htreviewsUrl
          : `${BASE_URL}${brand.htreviewsUrl}`,
      });
      seenSlugs.add(slug);
    }
  }

  return brands;
}

/**
 * Remove duplicate brands based on slug
 * @param brands - Array of ScrapedBrand objects
 * @returns Array of unique brands
 */
function removeDuplicates(brands: ScrapedBrand[]): ScrapedBrand[] {
  const seen = new Map<string, ScrapedBrand>();

  for (const brand of brands) {
    if (!seen.has(brand.slug)) {
      seen.set(brand.slug, brand);
    }
  }

  return Array.from(seen.values());
}

/**
 * Scrape brands from htreviews.org using JavaScript evaluation with infinite scroll
 * @param page - Playwright Page instance
 * @param config - Scraper configuration
 * @returns Promise resolving to array of ScrapedBrand objects
 */
export async function scrapeBrands(
  page: Page,
  config: ScrapeConfig
): Promise<ScrapedBrand[]> {
  logger.info(`Starting brand scrape from ${BRANDS_URL}`);

  const brands: ScrapedBrand[] = [];

  try {
    // Navigate to brands page with retry logic
    await retryWithBackoff(
      async () => {
        await page.goto(BRANDS_URL, {
          timeout: config.timeout,
          waitUntil: 'networkidle',
        });
      },
      config.maxRetries,
      2000
    );

    logger.debug('Page loaded successfully');

    // Wait for JavaScript-rendered content
    await waitForContent(page, 5000);

    // Debug: Check page content
    const pageTitle = await page.title();
    logger.debug(`Page title: ${pageTitle}`);

    const pageContent = await page.evaluate(() => {
      return {
        bodyLength: document.body.innerHTML.length,
        linkCount: document.querySelectorAll('a').length,
        scriptCount: document.querySelectorAll('script').length,
      };
    });
    logger.debug(
      `Page content: ${pageContent.bodyLength} chars, ${pageContent.linkCount} links, ${pageContent.scriptCount} scripts`
    );

    // Extract initial brands
    let currentBrands = await extractBrands(page);
    brands.push(...currentBrands);
    logger.info(`Initial extraction: ${currentBrands.length} brands`);

    // Implement infinite scroll
    let previousCount = currentBrands.length;
    let scrollAttempts = 0;
    const maxScrollAttempts = 50;

    while (scrollAttempts < maxScrollAttempts) {
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait for new content to load
      await sleep(2000);

      // Extract brands again
      currentBrands = await extractBrands(page);
      const currentCount = currentBrands.length;

      // If no new brands found, we're done
      if (currentCount === previousCount) {
        logger.info(`No new brands found after ${scrollAttempts} scrolls`);
        break;
      }

      brands.length = 0;
      brands.push(...removeDuplicates([...brands, ...currentBrands]));
      previousCount = currentCount;
      scrollAttempts++;
      logger.info(`Scroll ${scrollAttempts}: Found ${brands.length} total brands`);
    }

    if (brands.length > 0) {
      logger.info(`Successfully extracted ${brands.length} unique brands with infinite scroll`);
    } else {
      logger.warn(
        'No brands found with any extraction strategy. The website structure may have changed.'
      );
    }

    return brands;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to scrape brands: ${errorMessage}`);
    throw error;
  }
}

/**
 * Scrape a single brand page to verify and get additional data
 * @param page - Playwright Page instance
 * @param brandUrl - URL of brand page
 * @param config - Scraper configuration
 * @returns Promise resolving to ScrapedBrand object or null
 */
export async function scrapeBrandPage(
  page: Page,
  brandUrl: string,
  config: ScrapeConfig
): Promise<ScrapedBrand | null> {
  try {
    await retryWithBackoff(
      async () => {
        await page.goto(brandUrl, {
          timeout: config.timeout,
          waitUntil: 'networkidle',
        });
      },
      config.maxRetries,
      2000
    );

    console.log(`[DEBUG] Loaded brand page: ${brandUrl}`);

    // Wait for JavaScript-rendered content
    await waitForContent(page, 5000);

    // Debug: Check JSON-LD data
    const jsonLdData = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      const results: any[] = [];
      scripts.forEach((script: any) => {
        try {
          const data = JSON.parse(script.textContent || '');
          results.push(data);
        } catch {
          // Ignore
        }
      });
      return results;
    });
    console.log(`[DEBUG] JSON-LD data:`, JSON.stringify(jsonLdData, null, 2));

    // Extract brand data using JavaScript evaluation
    const brandData = await page.evaluate(() => {
      // Extract name
      const nameSelectors = [
        'h1',
        '.brand-name',
        '.page-title',
        'title',
        '[class*="brand"] h1',
      ];
      let name: string | null = null;

      for (const selector of nameSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          name = element.textContent.trim();
          if (name) break;
        }
      }

      // Extract description from JSON-LD first
      let description: string | null = null;
      let imageUrl: string | null = null;

      try {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of Array.from(scripts)) {
          try {
            const data = JSON.parse((script as any).textContent || '');
            // Look for Brand objects
            if (Array.isArray(data)) {
              for (const item of data) {
                if (item['@type'] === 'Brand' && item.description) {
                  description = item.description;
                  if (item.image) {
                    imageUrl = item.image;
                  }
                  break;
                }
              }
            } else if (data['@type'] === 'Brand' && data.description) {
              description = data.description;
              if (data.image) {
                imageUrl = data.image;
              }
              break;
            }
            if (description) break;
          } catch {
            // Ignore JSON parsing errors
          }
        }
      } catch {
        // Ignore errors
      }

      // If no description from JSON-LD, try DOM selectors
      if (!description) {
        const descSelectors = [
          '.object_card_discr span',
          '.brand-description',
          '.description',
          '.about-brand',
          '[class*="description"]',
          'div[class*="text"] p',
          'article p',
          'main p',
          '.content p',
        ];

        for (const selector of descSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            const text = element.textContent.trim();
            // Look for description with substantial length (not just a short phrase)
            if (text.length > 50) {
              description = text;
              break;
            }
          }
        }
      }

      // Extract image URL if not already found from JSON-LD
      if (!imageUrl) {
        const imgSelectors = [
          '.brand-image img',
          '.brand-logo img',
          '.brand-photo img',
          'img.brand-photo',
          'img[class*="brand"]',
        ];

        for (const selector of imgSelectors) {
          const element = document.querySelector(selector) as HTMLImageElement;
          if (element && element.src) {
            imageUrl = element.src;
            break;
          }
        }

        // Try alternative: find first img in main content area
        if (!imageUrl) {
          const mainContent = document.querySelector('main, .main, .content, #main');
          if (mainContent) {
            const firstImg = mainContent.querySelector('img') as HTMLImageElement;
            if (firstImg && firstImg.src) {
              imageUrl = firstImg.src;
            }
          }
        }
      }

      return {
        name,
        description,
        imageUrl,
      };
    });

    if (!brandData.name) {
      console.log(`[DEBUG] Could not extract brand name from ${brandUrl}`);
      return null;
    }

    // Extract slug from URL
    const slugMatch = brandUrl.match(/\/tobaccos\/([^/]+)/);
    if (!slugMatch) {
      console.log(`[DEBUG] Could not extract slug from URL: ${brandUrl}`);
      return null;
    }

    const slug = slugMatch[1].toLowerCase();

    const brand: ScrapedBrand = {
      name: cleanText(brandData.name),
      slug,
      description: brandData.description || '',
      imageUrl: brandData.imageUrl || '',
      htreviewsUrl: brandUrl,
    };

    console.log(
      `[DEBUG] Scraped brand: ${brand.name} (${slug}), imageUrl: ${brand.imageUrl || 'NULL'}, description length: ${brand.description.length}`
    );
    return brand;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`[DEBUG] Failed to scrape brand page ${brandUrl}: ${errorMessage}`);
    return null;
  }
}

/**
 * Remove duplicate brands based on slug
 * @param brands - Array of ScrapedBrand objects
 * @returns Array of unique brands
 */
export function deduplicateBrands(brands: ScrapedBrand[]): ScrapedBrand[] {
  const seen = new Map<string, ScrapedBrand>();

  for (const brand of brands) {
    if (!seen.has(brand.slug)) {
      seen.set(brand.slug, brand);
    }
  }

  const uniqueBrands = Array.from(seen.values());
  logger.debug(`Deduplicated ${brands.length} brands to ${uniqueBrands.length} unique brands`);

  return uniqueBrands;
}

export default {
  scrapeBrands,
  scrapeBrandPage,
  deduplicateBrands,
};
