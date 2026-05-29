import { Router } from 'express';
import { ContentController } from '../controllers/content.controller';

const router = Router();

// GET /api/contents
router.get('/contents', ContentController.list);

// GET /api/contents/:id
router.get('/contents/:id', ContentController.getById);

export default router;
