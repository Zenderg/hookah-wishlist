import { Page } from 'playwright';
import logger from '../config/logger.js';

/**
 * Wait for JavaScript-rendered content to appear
 * @param page - Playwright Page instance
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise resolving to true if content loaded successfully
 */
export async function waitForContent(page: Page, timeout = 5000): Promise<boolean> {
  try {
    logger.debug(`Waiting for content to load (timeout: ${timeout}ms)`);

    // Wait for network to be idle
    await page.waitForLoadState('networkidle', { timeout });

    // Additional wait for JavaScript rendering
    await page.waitForTimeout(2000);

    logger.debug('Content loaded successfully');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn(`Failed to wait for content: ${errorMessage}`);
    return false;
  }
}

/**
 * Extract data using JavaScript evaluation with multiple strategies
 * @param page - Playwright Page instance
 * @param strategies - Array of extraction functions to try
 * @returns Promise resolving to extracted data or null if all strategies fail
 */
export async function extractWithStrategies<T>(
  page: Page,
  strategies: Array<() => T>
): Promise<T | null> {
  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i];
    try {
      logger.debug(`Trying extraction strategy ${i + 1}/${strategies.length}`);

      // Capture console.log output from browser
      const logs: string[] = [];
      page.on('console', (msg) => {
        logs.push(`[Browser Console] ${msg.text()}`);
      });

      const result = await page.evaluate(strategy);

      // Log captured console messages
      if (logs.length > 0) {
        logs.forEach((log) => logger.debug(log));
      }

      // Check if result is valid
      const isValid = Array.isArray(result)
        ? result.length > 0
        : result !== null && result !== undefined;

      if (isValid) {
        logger.debug(
          `Strategy ${i + 1} succeeded, found ${Array.isArray(result) ? result.length : 1} items`
        );
        return result;
      } else {
        logger.debug(`Strategy ${i + 1} returned no data`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.debug(`Strategy ${i + 1} failed: ${errorMessage}`);
      continue;
    }
  }

  logger.warn('All extraction strategies failed');
  return null;
}

/**
 * Wait for a specific element to appear in the DOM
 * @param page - Playwright Page instance
 * @param selector - CSS selector to wait for
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise resolving to true if element appeared
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<boolean> {
  try {
    logger.debug(`Waiting for element: ${selector}`);
    await page.waitForSelector(selector, { timeout });
    logger.debug(`Element found: ${selector}`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Element not found: ${selector} - ${errorMessage}`);
    return false;
  }
}

export default {
  waitForContent,
  extractWithStrategies,
  waitForElement,
};
