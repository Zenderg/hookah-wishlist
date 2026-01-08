import { Response } from 'express';
import logger from '@/utils/logger';
import searchService from '@/services/search.service';
import { AuthenticatedRequest } from '../middleware/auth';

export class SearchController {
  async search(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { query, page = 1, pageSize = 20 } = req.query;

      logger.info(`API: Search for query "${query}" by user ${req.telegramUser?.userId}`);

      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'query parameter is required' });
        return;
      }

      const pageNum = parseInt(page as string, 10);
      const pageSizeNum = parseInt(pageSize as string, 10);

      const result = await searchService.search(query, pageNum, pageSizeNum);

      res.json(result);
    } catch (error) {
      logger.error('Error in search:', error);
      res.status(500).json({ error: 'Failed to search' });
    }
  }

  async getTobaccoDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      logger.info(`API: Get tobacco details for ID ${id}`);

      const tobacco = await searchService.getTobaccoDetails(id);

      if (!tobacco) {
        res.status(404).json({ error: 'Tobacco not found' });
        return;
      }

      res.json(tobacco);
    } catch (error) {
      logger.error('Error getting tobacco details:', error);
      res.status(500).json({ error: 'Failed to get tobacco details' });
    }
  }

  async getBrands(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info(`API: Get brands`);

      const brands = await searchService.getAvailableBrands();

      res.json({ brands });
    } catch (error) {
      logger.error('Error getting brands:', error);
      res.status(500).json({ error: 'Failed to get brands' });
    }
  }

  async getFlavors(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info(`API: Get flavors`);

      const flavors = await searchService.getAvailableFlavors();

      res.json({ flavors });
    } catch (error) {
      logger.error('Error getting flavors:', error);
      res.status(500).json({ error: 'Failed to get flavors' });
    }
  }
}

export const searchController = new SearchController();
