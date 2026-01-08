import { Router } from 'express';
import { authenticateTelegramUser } from '../middleware/auth';
import { wishlistController } from '../controllers/wishlist.controller';

const router = Router();

// All routes require authentication
router.use(authenticateTelegramUser);

// GET /api/v1/wishlist - Get user's wishlist
router.get('/', wishlistController.getWishlist.bind(wishlistController));

// POST /api/v1/wishlist - Add item to wishlist
router.post('/', wishlistController.addItem.bind(wishlistController));

// DELETE /api/v1/wishlist/:tobaccoId - Remove item from wishlist
router.delete('/:tobaccoId', wishlistController.removeItem.bind(wishlistController));

// DELETE /api/v1/wishlist - Clear entire wishlist
router.delete('/', wishlistController.clearWishlist.bind(wishlistController));

export default router;
