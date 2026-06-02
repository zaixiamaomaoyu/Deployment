import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import svgCaptcha from 'svg-captcha';
import { UsersModel } from '../models/users.model';
import { logger } from '../utils/logger';

// 内存限流：IP -> { count, resetTime }
const captchaRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 分钟
const RATE_LIMIT_MAX = 5;

export class AuthController {
  /**
   * 用户登录
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    const { username, password, captcha } = req.body;

    if (!username || !password || !captcha) {
      res.status(400).json({ code: 'MISSING_FIELDS', message: '请填写用户名、密码和验证码' });
      return;
    }

    // 校验验证码
    const captchaValid = AuthController.validateCaptcha(req, captcha);
    if (!captchaValid.ok) {
      res.status(400).json({ code: 'INVALID_CAPTCHA', message: captchaValid.message });
      return;
    }

    try {
      const user = await UsersModel.findByUsername(username);

      if (!user) {
        res.status(401).json({ code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({ code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' });
        return;
      }

      // 防止 Session Fixation：重新生成 session ID
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      req.session.userId = user.id;

      res.json({
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        role: user.role,
      });
    } catch (error) {
      logger.error('登录失败:', error);
      res.status(500).json({
        code: 'LOGIN_ERROR',
        message: '服务器内部错误',
      });
    }
  }

  /**
   * 用户注册
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    const { username, password, confirmPassword, captcha } = req.body;

    if (!username || !password || !confirmPassword || !captcha) {
      res.status(400).json({ code: 'MISSING_FIELDS', message: '请填写所有必填项' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ code: 'PASSWORD_MISMATCH', message: '两次输入的密码不一致' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ code: 'PASSWORD_TOO_SHORT', message: '密码至少需要6位' });
      return;
    }

    // 校验验证码
    const captchaValid = AuthController.validateCaptcha(req, captcha);
    if (!captchaValid.ok) {
      res.status(400).json({ code: 'INVALID_CAPTCHA', message: captchaValid.message });
      return;
    }

    try {
      const existingUser = await UsersModel.findByUsername(username);
      if (existingUser) {
        res.status(409).json({ code: 'USERNAME_EXISTS', message: '用户名已被注册' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = await UsersModel.createUserWithPassword({
        username,
        password_hash: passwordHash,
        role: 'user',
      });

      const user = await UsersModel.findById(userId);
      if (!user) {
        res.status(500).json({ code: 'USER_CREATION_FAILED', message: '用户创建失败' });
        return;
      }

      // 防止 Session Fixation：重新生成 session ID
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      req.session.userId = user.id;

      res.status(201).json({
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        role: user.role,
      });
    } catch (error) {
      logger.error('注册失败:', error);
      res.status(500).json({
        code: 'REGISTER_ERROR',
        message: '服务器内部错误',
      });
    }
  }

  /**
   * 获取验证码
   * GET /api/auth/captcha
   */
  static async getCaptcha(req: Request, res: Response): Promise<void> {
    const clientIp = AuthController.getClientIp(req);

    // 限流检查
    const now = Date.now();
    const limit = captchaRateLimit.get(clientIp);
    if (limit && now < limit.resetTime) {
      if (limit.count >= RATE_LIMIT_MAX) {
        res.status(429).json({ code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' });
        return;
      }
      limit.count += 1;
    } else {
      captchaRateLimit.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    }

    const captcha = svgCaptcha.create({
      size: 4,
      noise: 2,
      color: true,
      background: '#f0f0f0',
      width: 120,
      height: 40,
    });

    req.session.captcha = {
      text: captcha.text.toLowerCase(),
      expires: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    };

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(captcha.data);
  }

  /**
   * 获取当前登录用户信息
   * GET /api/auth/me
   */
  static async me(req: Request, res: Response): Promise<void> {
    const userId = req.session?.userId;

    if (!userId) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: '未登录' });
      return;
    }

    try {
      const user = await UsersModel.findById(userId);

      if (!user) {
        res.status(401).json({ code: 'USER_NOT_FOUND', message: '用户不存在' });
        return;
      }

      res.json({
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        role: user.role,
      });
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: '获取用户信息失败',
      });
    }
  }

  /**
   * 退出登录
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    req.session?.destroy((err) => {
      if (err) {
        logger.error('退出登录失败:', err);
        res.status(500).json({ code: 'LOGOUT_ERROR', message: '退出登录失败' });
        return;
      }
      res.json({ code: 'SUCCESS', message: '已退出登录' });
    });
  }

  // ============ 私有辅助方法 ============

  private static validateCaptcha(
    req: Request,
    inputCaptcha: string
  ): { ok: boolean; message: string } {
    const sessionCaptcha = req.session?.captcha;

    if (!sessionCaptcha) {
      return { ok: false, message: '验证码已过期，请刷新' };
    }

    if (Date.now() > sessionCaptcha.expires) {
      delete req.session.captcha;
      return { ok: false, message: '验证码已过期，请刷新' };
    }

    if (sessionCaptcha.attempts >= 3) {
      delete req.session.captcha;
      return { ok: false, message: '验证码已过期，请刷新' };
    }

    if (sessionCaptcha.text !== String(inputCaptcha).toLowerCase()) {
      sessionCaptcha.attempts += 1;
      if (sessionCaptcha.attempts >= 3) {
        delete req.session.captcha;
        return { ok: false, message: '验证码已过期，请刷新' };
      }
      return { ok: false, message: '验证码错误' };
    }

    // 验证成功，清除验证码
    delete req.session.captcha;
    return { ok: true, message: '' };
  }

  private static getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
  }
}
