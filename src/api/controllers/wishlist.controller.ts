import { Response } from 'express';
import logger from '@/utils/logger';
import wishlistService from '@/services/wishlist.service';
import { AuthenticatedRequest } from '../middleware/auth';

export class WishlistController {
  async getWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;

      logger.info(`API: Get wishlist for user ${userId}`);

      const wishlist = await wishlistService.getWishlistWithDetails(userId);

      if (!wishlist) {
        res.json({
          userId,
          items: [],
          total: 0,
        });
        return;
      }

      res.json({
        userId: wishlist.userId,
        items: wishlist.items,
        total: wishlist.items.length,
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt,
      });
    } catch (error) {
      logger.error('Error getting wishlist:', error);
      res.status(500).json({ error: 'Failed to get wishlist' });
    }
  }

  async addItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { tobaccoId, notes } = req.body;

      logger.info(`API: Add tobacco ${tobaccoId} to wishlist for user ${userId}`);

      if (!tobaccoId) {
        res.status(400).json({ error: 'tobaccoId is required' });
        return;
      }

      const wishlist = await wishlistService.addItem(userId, tobaccoId, notes);

      res.json({
        success: true,
        wishlist: {
          userId: wishlist.userId,
          items: wishlist.items,
          total: wishlist.items.length,
          updatedAt: wishlist.updatedAt,
        },
      });
    } catch (error: any) {
      logger.error('Error adding to wishlist:', error);

      if (error.message === 'Tobacco already in wishlist') {
        res.status(409).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Failed to add to wishlist' });
    }
  }

  async removeItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { tobaccoId } = req.params;

      logger.info(`API: Remove tobacco ${tobaccoId} from wishlist for user ${userId}`);

      if (!tobaccoId) {
        res.status(400).json({ error: 'tobaccoId is required' });
        return;
      }

      const wishlist = await wishlistService.removeItem(userId, tobaccoId);

      res.json({
        success: true,
        wishlist: {
          userId: wishlist.userId,
          items: wishlist.items,
          total: wishlist.items.length,
          updatedAt: wishlist.updatedAt,
        },
      });
    } catch (error: any) {
      logger.error('Error removing from wishlist:', error);

      if (error.message === 'Wishlist not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message === 'Tobacco not found in wishlist') {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
  }

  async clearWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;

      logger.info(`API: Clear wishlist for user ${userId}`);

      await wishlistService.clearWishlist(userId);

      res.json({
        success: true,
        message: 'Wishlist cleared successfully',
      });
    } catch (error: any) {
      logger.error('Error clearing wishlist:', error);

      if (error.message === 'Wishlist not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Failed to clear wishlist' });
    }
  }
}

export const wishlistController = new WishlistController();
