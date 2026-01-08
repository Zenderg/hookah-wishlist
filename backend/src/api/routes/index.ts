import { Router } from 'express';
import wishlistRoutes from './wishlist';
import searchRoutes from './search';

const router = Router();

// API v1 routes
router.use('/v1/wishlist', wishlistRoutes);
router.use('/v1/search', searchRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
