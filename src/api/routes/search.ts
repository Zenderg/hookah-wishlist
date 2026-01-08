import { Router } from 'express';
import { authenticateTelegramUser } from '../middleware/auth';
import { searchController } from '../controllers/search.controller';

const router = Router();

// All routes require authentication
router.use(authenticateTelegramUser);

// GET /api/v1/search - Search tobaccos
router.get('/', searchController.search.bind(searchController));

// GET /api/v1/search/brands - Get available brands
router.get('/brands', searchController.getBrands.bind(searchController));

// GET /api/v1/search/flavors - Get available flavors
router.get('/flavors', searchController.getFlavors.bind(searchController));

// GET /api/v1/tobacco/:id - Get tobacco details
router.get('/tobacco/:id', searchController.getTobaccoDetails.bind(searchController));

export default router;
