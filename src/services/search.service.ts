import logger from '@/utils/logger';
import hookahDbService from './hookah-db.service';
import { Tobacco, TobaccoSearchResult, TobaccoSearchParams } from '@/models/tobacco';

export class SearchService {
  async search(query: string, page: number = 1, pageSize: number = 10): Promise<TobaccoSearchResult> {
    logger.info(`Searching for tobaccos with query: ${query}`);

    const params: TobaccoSearchParams = {
      query,
      page,
      pageSize,
    };

    const result = await hookahDbService.searchTobaccos(params);

    logger.info(`Found ${result.total} tobaccos matching "${query}"`);

    return result;
  }

  async searchByBrand(brand: string, page: number = 1, pageSize: number = 10): Promise<TobaccoSearchResult> {
    logger.info(`Searching for tobaccos by brand: ${brand}`);

    const params: TobaccoSearchParams = {
      brand,
      page,
      pageSize,
    };

    return await hookahDbService.searchTobaccos(params);
  }

  async searchByFlavor(flavor: string, page: number = 1, pageSize: number = 10): Promise<TobaccoSearchResult> {
    logger.info(`Searching for tobaccos by flavor: ${flavor}`);

    const params: TobaccoSearchParams = {
      flavor,
      page,
      pageSize,
    };

    return await hookahDbService.searchTobaccos(params);
  }

  async getTobaccoDetails(id: string): Promise<Tobacco | null> {
    logger.info(`Getting tobacco details for ID: ${id}`);

    return await hookahDbService.getTobaccoById(id);
  }

  async getAvailableBrands(): Promise<string[]> {
    logger.info('Getting available brands');

    return await hookahDbService.getBrands();
  }

  async getAvailableFlavors(): Promise<string[]> {
    logger.info('Getting available flavors');

    return await hookahDbService.getFlavors();
  }

  formatSearchResults(results: Tobacco[], page: number, total: number): string {
    if (results.length === 0) {
      return 'No tobaccos found. Try a different search term.';
    }

    let message = `📊 Search Results (Page ${page})\n`;
    message += `Found ${total} tobacco(s)\n\n`;

    results.forEach((tobacco, index) => {
      message += `${index + 1}. ${tobacco.brand} - ${tobacco.name}\n`;
      message += `   🏷️ ID: ${tobacco.id}\n`;
      if (tobacco.flavor) {
        message += `   🍃 Flavor: ${tobacco.flavor}\n`;
      }
      if (tobacco.strength) {
        message += `   💪 Strength: ${tobacco.strength}\n`;
      }
      message += '\n';
    });

    message += `Use /add <tobacco_id> to add to your wishlist`;

    return message;
  }
}

export const searchService = new SearchService();
export default searchService;
