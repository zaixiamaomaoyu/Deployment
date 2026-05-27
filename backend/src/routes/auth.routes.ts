import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

// GET /api/auth/wechat/callback?code=xxx
router.get('/auth/wechat/callback', AuthController.wechatCallback);

// GET /api/auth/me
router.get('/auth/me', AuthController.me);

// POST /api/auth/logout
router.post('/auth/logout', AuthController.logout);

export default router;
