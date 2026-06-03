import { Router } from 'express';
import { FavoriteController } from '../controllers/favorites.controller';

const router = Router();

// GET /api/favorites
router.get('/favorites', FavoriteController.list);

// POST /api/favorites/:contentId/toggle
router.post('/favorites/:contentId/toggle', FavoriteController.toggle);

// GET /api/favorites/:contentId/status
router.get('/favorites/:contentId/status', FavoriteController.getStatus);

export default router;
