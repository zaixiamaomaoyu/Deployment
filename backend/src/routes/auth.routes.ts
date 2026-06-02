import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

// GET /api/auth/captcha
router.get('/auth/captcha', AuthController.getCaptcha);

// POST /api/auth/login
router.post('/auth/login', AuthController.login);

// POST /api/auth/register
router.post('/auth/register', AuthController.register);

// GET /api/auth/me
router.get('/auth/me', AuthController.me);

// POST /api/auth/logout
router.post('/auth/logout', AuthController.logout);

export default router;
