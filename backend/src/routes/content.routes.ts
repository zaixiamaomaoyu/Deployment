import { Router } from 'express';
import { ContentController } from '../controllers/content.controller';

const router = Router();

// GET /api/contents
router.get('/contents', ContentController.list);

// GET /api/contents/:id
router.get('/contents/:id', ContentController.getById);

// GET /api/contents/:id/neighbors
router.get('/contents/:id/neighbors', ContentController.getNeighbors);

export default router;
