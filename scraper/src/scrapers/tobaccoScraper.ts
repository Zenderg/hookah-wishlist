import { Page } from 'playwright';
import logger from '../config/logger.js';
import { waitForContent } from '../utils/waitForContent.js';
import type { ScrapedTobacco, ScrapedBrand, ScrapeConfig } from '../types/index.js';

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
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sleep for specified milliseconds (alias for delay)
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract tobacco links from page
 * @param page - Playwright Page instance
 * @param brandSlug - Brand slug to filter by
 * @returns Promise resolving to array of tobacco link objects
 */
async function extractLinksFromPage(
  page: Page,
  brandSlug: string
): Promise<Array<{ name: string; slug: string; htreviewsUrl: string }>> {
  const allResults: Array<{ name: string; slug: string; htreviewsUrl: string }> = [];

  // Try strategy 1: Look for all tobacco links
  try {
    const results1 = await page.evaluate(() => {
      const results: Array<{ name: string; slug: string; htreviewsUrl: string }> = [];
      const links = document.querySelectorAll('a[href*="/tobaccos/"]');

      console.log(`[DEBUG Strategy 1] Found ${links.length} links with /tobaccos/`);

      links.forEach((link: any) => {
        const href = link.href;
        // Skip brand pages
        if (href.includes('/tobaccos/brands/')) return;

        // Match pattern: /tobaccos/{brand}/{line}/{flavor}
        const urlParts = href.match(/\/tobaccos\/([^/]+)\/([^/]+)\/([^/?]+)/);
        if (!urlParts) return;

        const name =
          link.querySelector('[class*="name"], [class*="title"]')?.textContent?.trim() ||
          link.textContent?.trim();
        if (!name) return;

        // Build URL correctly - check if it's already a full URL
        const htreviewsUrl = href.startsWith('http') ? href : `https://htreviews.org${href}`;

        results.push({
          name,
          slug: urlParts[3],
          htreviewsUrl,
        });
      });

      console.log(`[DEBUG Strategy 1] Extracted ${results.length} tobacco links`);
      return results;
    });

    // Filter by brand slug
    const filtered1 = results1.filter((r) => {
      const urlMatch = r.htreviewsUrl.match(/\/tobaccos\/([^/]+)\//);
      return urlMatch && urlMatch[1].toLowerCase() === brandSlug;
    });

    logger.debug(`Strategy 1 found ${filtered1.length} links for brand ${brandSlug}`);
    allResults.push(...filtered1);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Strategy 1 failed: ${errorMessage}`);
  }

  // Try strategy 2: Look for tobacco cards
  try {
    const results2 = await page.evaluate(() => {
      const results: Array<{ name: string; slug: string; htreviewsUrl: string }> = [];
      const cards = document.querySelectorAll(
        '[class*="card"], [class*="tobacco"], [class*="product"]'
      );

      console.log(`[DEBUG Strategy 2] Found ${cards.length} cards`);

      cards.forEach((card: any) => {
        const link = card.querySelector('a');
        if (!link || !link.href) return;

        const href = link.href;
        // Skip brand pages
        if (href.includes('/tobaccos/brands/')) return;

        // Match pattern: /tobaccos/{brand}/{line}/{flavor}
        const urlParts = href.match(/\/tobaccos\/([^/]+)\/([^/]+)\/([^/?]+)/);
        if (!urlParts) return;

        const nameElement = card.querySelector('h1, h2, h3, [class*="name"], [class*="title"]');
        const name = nameElement?.textContent?.trim() || link.textContent?.trim();
        if (!name) return;

        // Build URL correctly - check if it's already a full URL
        const htreviewsUrl = href.startsWith('http') ? href : `https://htreviews.org${href}`;

        results.push({
          name,
          slug: urlParts[3],
          htreviewsUrl,
        });
      });

      console.log(`[DEBUG Strategy 2] Extracted ${results.length} tobacco links`);
      return results;
    });

    // Filter by brand slug
    const filtered2 = results2.filter((r) => {
      const urlMatch = r.htreviewsUrl.match(/\/tobaccos\/([^/]+)\//);
      return urlMatch && urlMatch[1].toLowerCase() === brandSlug;
    });

    logger.debug(`Strategy 2 found ${filtered2.length} links for brand ${brandSlug}`);
    allResults.push(...filtered2);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Strategy 2 failed: ${errorMessage}`);
  }

  // Try strategy 3: Look for embedded JSON data
  try {
    const results3 = await page.evaluate(() => {
      const results: Array<{ name: string; slug: string; htreviewsUrl: string }> = [];

      try {
        const scripts = document.querySelectorAll(
          'script[type="application/json"], script[type="application/ld+json"]'
        );
        console.log(`[DEBUG Strategy 3] Found ${scripts.length} JSON scripts`);

        scripts.forEach((script: any) => {
          try {
            const data = JSON.parse(script.textContent || '');
            // Try to find tobaccos in JSON structure
            const findTobaccos = (obj: any): void => {
              if (Array.isArray(obj)) {
                obj.forEach(findTobaccos);
              } else if (obj && typeof obj === 'object') {
                if (
                  obj.name &&
                  obj.slug &&
                  obj.htreviewsUrl &&
                  !obj.htreviewsUrl.includes('/brands/')
                ) {
                  results.push({
                    name: obj.name,
                    slug: obj.slug,
                    htreviewsUrl: obj.htreviewsUrl,
                  });
                }
                Object.values(obj).forEach(findTobaccos);
              }
            };
            findTobaccos(data);
          } catch {
            // Ignore JSON parsing errors
          }
        });
      } catch {
        // Ignore errors
      }

      console.log(`[DEBUG Strategy 3] Extracted ${results.length} tobacco links`);
      return results;
    });

    // Filter by brand slug
    const filtered3 = results3.filter((r) => {
      const urlMatch = r.htreviewsUrl.match(/\/tobaccos\/([^/]+)\//);
      return urlMatch && urlMatch[1].toLowerCase() === brandSlug;
    });

    logger.debug(`Strategy 3 found ${filtered3.length} links for brand ${brandSlug}`);
    allResults.push(...filtered3);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Strategy 3 failed: ${errorMessage}`);
  }

  // Normalize and deduplicate links
  const links: Array<{ name: string; slug: string; htreviewsUrl: string }> = [];
  const seenSlugs = new Set<string>();

  for (const link of allResults) {
    const slug = link.slug.toLowerCase();
    if (!seenSlugs.has(slug) && link.name.trim()) {
      links.push({
        name: link.name.trim(),
        slug,
        htreviewsUrl: link.htreviewsUrl,
      });
      seenSlugs.add(slug);
    }
  }

  return links;
}

/**
 * Remove duplicate links based on slug
 * @param links - Array of link objects
 * @returns Array of unique links
 */
function removeDuplicateLinks(
  links: Array<{ name: string; slug: string; htreviewsUrl: string }>
): Array<{ name: string; slug: string; htreviewsUrl: string }> {
  const seen = new Map<string, { name: string; slug: string; htreviewsUrl: string }>();

  for (const link of links) {
    if (!seen.has(link.slug)) {
      seen.set(link.slug, link);
    }
  }

  return Array.from(seen.values());
}

/**
 * Scrape tobacco details from a detail page
 * @param page - Playwright Page instance
 * @param tobaccoUrl - URL of the tobacco detail page
 * @param config - Scraper configuration
 * @returns Promise resolving to ScrapedTobacco object or null
 */
export async function scrapeTobaccoPage(
  page: Page,
  tobaccoUrl: string,
  config: ScrapeConfig
): Promise<ScrapedTobacco | null> {
  try {
    // Add query parameters to URL
    const detailUrl = `${tobaccoUrl}?r=position&s=created&d=desc`;

    // Navigate to tobacco page with retry logic
    await retryWithBackoff(
      async () => {
        await page.goto(detailUrl, {
          timeout: config.timeout,
          waitUntil: 'networkidle',
        });
      },
      config.maxRetries,
      2000
    );

    console.log(`[DEBUG] Loaded tobacco page: ${detailUrl}`);

    // Wait for JavaScript-rendered content
    await waitForContent(page, 5000);

    // Debug: Check page structure
    const pageStructure = await page.evaluate(() => {
      return {
        title: document.title,
        imageCount: document.querySelectorAll('img').length,
        imageWithProductClass: document.querySelectorAll('img[class*="product"]').length,
        imageWithTobaccoClass: document.querySelectorAll('img[class*="tobacco"]').length,
        imageInCard: document.querySelectorAll('.card img, .product img, .tobacco img').length,
        firstImageSrc: document.querySelector('img')?.src || 'none',
      };
    });
    console.log(
      `[DEBUG] Page structure: ${pageStructure.title}, ${pageStructure.imageCount} images, ${pageStructure.imageWithProductClass} with product class, ${pageStructure.imageWithTobaccoClass} with tobacco class, ${pageStructure.imageInCard} in card, first img src: ${pageStructure.firstImageSrc}`
    );

    // Extract tobacco data using JavaScript evaluation
    const tobaccoData = await page.evaluate(() => {
      // Extract name
      const nameSelectors = [
        'h1',
        '.tobacco-name',
        '.product-name',
        '.page-title',
        '[class*="title"]',
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
        for (const script of scripts) {
          try {
            const data = JSON.parse((script as any).textContent || '');
            // Look for Product objects
            if (Array.isArray(data)) {
              for (const item of data) {
                if (item['@type'] === 'Product' && item.description) {
                  description = item.description;
                  if (item.image) {
                    imageUrl = item.image;
                  }
                  break;
                }
              }
            } else if (data['@type'] === 'Product' && data.description) {
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
          '.tobacco-description',
          '.description',
          '.product-description',
          '[class*="description"]',
          'article p',
          'main p',
          '.content p',
          'div[class*="text"] p',
          'div[class*="content"] p',
          'section p',
          '.text-block p',
          '.about p',
          'p',
        ];

        for (const selector of descSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            const text = element.textContent.trim();
            // Look for description with reasonable length (not just a short phrase)
            // Skip very short descriptions (less than 20 chars)
            // Skip descriptions that look like names or metadata
            if (text.length > 20 && !text.match(/^[А-Яа-яA-Za-z]+$/)) {
              description = text;
              break;
            }
          }
        }
      }

      // Extract image URL if not already found from JSON-LD
      if (!imageUrl) {
        const imgSelectors = [
          '.tobacco-image img',
          '.product-image img',
          '.main-image img',
          'img.product-photo',
          'img[class*="product"]',
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

      // Extract metadata
      const strengthSelectors = [
        '.strength',
        '.tobacco-strength',
        '.product-strength',
        '[data-strength]',
        '.rating-strength',
      ];
      let strength: string | null = null;
      for (const selector of strengthSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          strength = element.textContent.trim();
          if (strength) break;
        }
      }

      const cutSelectors = ['.cut', '.tobacco-cut', '.product-cut', '[data-cut]', '.rating-cut'];
      let cut: string | null = null;
      for (const selector of cutSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          cut = element.textContent.trim();
          if (cut) break;
        }
      }

      const flavorSelectors = [
        '.flavor-profile',
        '.tobacco-flavor',
        '.product-flavor',
        '[data-flavor]',
        '.rating-flavor',
      ];
      let flavorProfile: string | null = null;
      for (const selector of flavorSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          flavorProfile = element.textContent.trim();
          if (flavorProfile) break;
        }
      }

      const ratingSelectors = [
        '.rating',
        '.score',
        '.tobacco-rating',
        '.product-rating',
        '[data-rating]',
      ];
      let ratingText: string | null = null;
      for (const selector of ratingSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          ratingText = element.textContent.trim();
          if (ratingText) break;
        }
      }

      const reviewsSelectors = [
        '.reviews-count',
        '.review-count',
        '.total-reviews',
        '[data-reviews]',
        '.num-reviews',
      ];
      let reviewsText: string | null = null;
      for (const selector of reviewsSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          reviewsText = element.textContent.trim();
          if (reviewsText) break;
        }
      }

      // Parse rating
      let rating: number | null = null;
      if (ratingText) {
        const match = ratingText.match(/(\d+\.?\d*)/);
        if (match) {
          rating = parseFloat(match[1]);
          if (isNaN(rating)) rating = null;
        }
      }

      // Parse reviews count
      let reviewsCount: number | null = null;
      if (reviewsText) {
        const match = reviewsText.match(/(\d+)/);
        if (match) {
          reviewsCount = parseInt(match[1], 10);
          if (isNaN(reviewsCount)) reviewsCount = null;
        }
      }

      return {
        name,
        description,
        imageUrl,
        metadata: {
          strength,
          cut,
          flavorProfile,
          rating,
          reviewsCount,
        },
      };
    });

    if (!tobaccoData.name) {
      console.log(`[DEBUG] Could not extract tobacco name from ${detailUrl}`);
      return null;
    }

    // Extract slug from tobaccoUrl (without query parameters)
    const slugMatch = tobaccoUrl.match(/\/tobaccos\/([^/]+)\/([^/]+)\/([^/]+)/);
    if (!slugMatch) {
      console.log(`[DEBUG] Could not extract slug from URL: ${tobaccoUrl}`);
      return null;
    }

    const slug = slugMatch[3].toLowerCase();

    console.log(
      `[DEBUG] Scraped tobacco: ${tobaccoData.name} (${slug}), imageUrl: ${tobaccoData.imageUrl || 'NULL'}, description: ${tobaccoData.description || 'NULL'}`
    );

    const tobacco: ScrapedTobacco = {
      name: tobaccoData.name,
      slug,
      description: tobaccoData.description || '',
      imageUrl: tobaccoData.imageUrl || '',
      htreviewsUrl: tobaccoUrl,
      metadata: tobaccoData.metadata,
    };

    return tobacco;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`[DEBUG] Failed to scrape tobacco page ${tobaccoUrl}: ${errorMessage}`);
    return null;
  }
}

/**
 * Scrape all tobaccos for a brand from brand page with infinite scroll
 * @param page - Playwright Page instance
 * @param brand - ScrapedBrand object
 * @param config - Scraper configuration
 * @param limit - Maximum number of tobaccos to scrape (optional, no limit if not provided)
 * @returns Promise resolving to array of ScrapedTobacco objects
 */
export async function scrapeBrandTobaccos(
  page: Page,
  brand: ScrapedBrand,
  config: ScrapeConfig,
  limit?: number
): Promise<ScrapedTobacco[]> {
  const tobaccos: ScrapedTobacco[] = [];
  const seenSlugs = new Set<string>();

  // Add query parameters to brand URL
  const brandUrl = `${brand.htreviewsUrl}?r=position&s=rating&d=desc`;

  const limitInfo = limit ? ` (limit: ${limit})` : '';
  logger.info(`Scraping tobaccos for brand: ${brand.name} (${brandUrl})${limitInfo}`);

  try {
    // Navigate to brand page with retry logic
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

    // Debug: Check page content
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        linkCount: document.querySelectorAll('a').length,
        bodyLength: document.body.innerHTML.length,
      };
    });
    console.log(
      `[DEBUG] Page info: ${pageInfo.title}, ${pageInfo.linkCount} links, ${pageInfo.bodyLength} chars`
    );

    // Extract initial tobacco links
    let currentLinks = await extractLinksFromPage(page, brand.slug);
    logger.info(`Initial extraction: ${currentLinks.length} tobacco links`);

    // Implement infinite scroll with limit check
    let previousCount = currentLinks.length;
    let scrollAttempts = 0;
    const maxScrollAttempts = 50;

    while (scrollAttempts < maxScrollAttempts) {
      // Check if we have enough links
      if (limit && currentLinks.length >= limit) {
        logger.info(`Reached limit of ${limit} tobacco links, stopping scroll`);
        break;
      }

      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait for new content to load
      await sleep(2000);

      // Extract links again
      currentLinks = await extractLinksFromPage(page, brand.slug);
      const currentCount = currentLinks.length;

      // If no new links found, we're done
      if (currentCount === previousCount) {
        logger.info(`No new tobaccos found after ${scrollAttempts} scrolls`);
        break;
      }

      previousCount = currentCount;
      scrollAttempts++;
      logger.info(`Scroll ${scrollAttempts}: Found ${currentCount} total tobacco links`);
    }

    // Deduplicate links
    const uniqueLinks = removeDuplicateLinks(currentLinks);
    logger.info(`Found ${uniqueLinks.length} unique tobacco links for brand ${brand.name}`);

    // Process each tobacco link with limit
    for (const link of uniqueLinks) {
      // Check limit
      if (limit && tobaccos.length >= limit) {
        logger.info(`Reached limit of ${limit} tobaccos, stopping scrape`);
        break;
      }

      const slug = link.slug.toLowerCase();

      // Skip duplicates
      if (seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);

      // Rate limiting delay
      await delay(config.delayTobacco);

      // Scrape tobacco detail page
      const tobacco = await scrapeTobaccoPage(page, link.htreviewsUrl, config);

      if (tobacco) {
        tobaccos.push(tobacco);
        const progress = `${tobaccos.length}/${limit || '∞'}`;
        console.log(
          `[DEBUG] Scraped tobacco: ${tobacco.name} for brand ${brand.name} (${progress})`
        );
      }
    }

    logger.info(`Successfully scraped ${tobaccos.length} tobaccos for brand ${brand.name}`);

    return tobaccos;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to scrape tobaccos for brand ${brand.name}: ${errorMessage}`);
    return [];
  }
}

/**
 * Scrape tobaccos for multiple brands
 * @param page - Playwright Page instance
 * @param brands - Array of ScrapedBrand objects
 * @param config - Scraper configuration
 * @returns Promise resolving to array of ScrapedTobacco objects
 */
export async function scrapeAllTobaccos(
  page: Page,
  brands: ScrapedBrand[],
  config: ScrapeConfig
): Promise<ScrapedTobacco[]> {
  const allTobaccos: ScrapedTobacco[] = [];

  logger.info(`Starting tobacco scrape for ${brands.length} brands`);

  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i];
    logger.info(`Processing brand ${i + 1}/${brands.length}: ${brand.name}`);

    // Rate limiting delay between brands
    if (i > 0) {
      await delay(config.delayBrand);
    }

    const tobaccos = await scrapeBrandTobaccos(page, brand, config);
    allTobaccos.push(...tobaccos);
  }

  logger.info(`Completed tobacco scrape. Total tobaccos: ${allTobaccos.length}`);
  return allTobaccos;
}

export default {
  scrapeTobaccoPage,
  scrapeBrandTobaccos,
  scrapeAllTobaccos,
  delay,
};
