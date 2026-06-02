import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import svgCaptcha from 'svg-captcha';
import { UsersModel } from '../models/users.model';
import { logger } from '../utils/logger';

// 预生成的 dummy hash，用于用户不存在时抹平时序（M1）
const DUMMY_BCRYPT_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8eVjP3wW6PjsFQV3OJqZxXlBBKvWi2';

// 内存限流：IP -> { count, resetTime }
// 注意：H2 — 已通过 app.set('trust proxy', 1) 让 req.ip 正确识别客户端
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
    const captchaValid = AuthController.validateCaptcha(req, String(captcha));
    if (!captchaValid.ok) {
      res.status(400).json({ code: 'INVALID_CAPTCHA', message: captchaValid.message });
      return;
    }

    try {
      const user = await UsersModel.findByUsername(String(username));

      // M1 — 无论用户是否存在都执行 bcrypt 比较以抹平时序，防止用户名枚举
      const passwordHash = user?.password_hash || DUMMY_BCRYPT_HASH;

      // M6 — 校验 hash 格式，避免 bcrypt.compare 对非法 hash 抛错导致 500
      const isHashValid = typeof passwordHash === 'string' && passwordHash.startsWith('$2') && passwordHash.length >= 60;

      const isPasswordValid = isHashValid
        ? await bcrypt.compare(String(password), passwordHash)
        : false;

      if (!user || !isPasswordValid) {
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

      // M2 — 显式保存 session，避免响应结束前 store 异步写入失败导致登录态丢失
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

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

    const usernameStr = String(username);
    const passwordStr = String(password);
    const confirmStr = String(confirmPassword);

    if (passwordStr !== confirmStr) {
      res.status(400).json({ code: 'PASSWORD_MISMATCH', message: '两次输入的密码不一致' });
      return;
    }

    if (passwordStr.length < 6) {
      res.status(400).json({ code: 'PASSWORD_TOO_SHORT', message: '密码至少需要6位' });
      return;
    }

    // 防止超长密码触发 bcrypt DoS（bcrypt 仅取前 72 字节）
    if (passwordStr.length > 1024) {
      res.status(400).json({ code: 'PASSWORD_TOO_LONG', message: '密码长度不能超过1024位' });
      return;
    }

    // 校验验证码
    const captchaValid = AuthController.validateCaptcha(req, String(captcha));
    if (!captchaValid.ok) {
      res.status(400).json({ code: 'INVALID_CAPTCHA', message: captchaValid.message });
      return;
    }

    try {
      const existingUser = await UsersModel.findByUsername(usernameStr);
      if (existingUser) {
        res.status(409).json({ code: 'USERNAME_EXISTS', message: '用户名已被注册' });
        return;
      }

      const passwordHash = await bcrypt.hash(passwordStr, 10);

      let userId: number;
      try {
        userId = await UsersModel.createUserWithPassword({
          username: usernameStr,
          password_hash: passwordHash,
          role: 'user',
        });
      } catch (err: any) {
        // M5 — 并发注册时唯一约束冲突，转为友好 409
        if (err && (err.code === 'ER_DUP_ENTRY' || String(err.message || '').includes('Duplicate entry'))) {
          res.status(409).json({ code: 'USERNAME_EXISTS', message: '用户名已被注册' });
          return;
        }
        throw err;
      }

      const user = await UsersModel.findById(userId);
      if (!user) {
        res.status(500).json({ code: 'USER_CREATION_FAILED', message: '用户创建失败' });
        return;
      }

      // 防止 Session Fixation
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      req.session.userId = user.id;

      // M2 — 显式保存 session
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

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
    // L13 — 已登录用户不应再生成验证码
    if (req.session?.userId) {
      res.status(403).json({ code: 'FORBIDDEN', message: '已登录用户无需验证码' });
      return;
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

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

    try {
      const captcha = svgCaptcha.create({
        size: 4,
        noise: 2,
        color: true,
        background: '#f0f0f0',
        width: 120,
        height: 40,
      });

      // M7 — 保留旧 attempts 计数，防止通过刷新绕过 3 次错误限制
      const previousAttempts = req.session?.captcha?.attempts || 0;

      req.session.captcha = {
        text: captcha.text.toLowerCase(),
        expires: Date.now() + 5 * 60 * 1000,
        attempts: previousAttempts,
      };

      // M2 — 显式保存 session
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // L4 — 禁用缓存，避免浏览器/反代缓存旧验证码 SVG
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(captcha.data);
    } catch (error) {
      logger.error('验证码生成失败:', error);
      res.status(503).json({ code: 'CAPTCHA_ERROR', message: '验证码生成失败，请稍后再试' });
    }
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
        // L9 — 用户已被删除，主动清理 session
        await new Promise<void>((resolve) => {
          req.session.destroy(() => resolve());
        });
        res.status(401).json({ code: 'USER_NOT_FOUND', message: '用户不存在，请重新登录' });
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
      // M4 — 统一 500 文案
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误',
      });
    }
  }

  /**
   * 退出登录
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    // L3 — 未登录用户调用 logout 直接返回 401
    if (!req.session?.userId) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: '未登录' });
      return;
    }

    req.session.destroy((err) => {
      if (err) {
        logger.error('退出登录失败:', err);
        // M4 — 统一 500 文案
        res.status(500).json({ code: 'LOGOUT_ERROR', message: '服务器内部错误' });
        return;
      }
      // L2 — 清理客户端 cookie
      res.clearCookie('connect.sid', { path: '/' });
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

    // L5 — NFKC 归一化处理全角字符，再统一小写比较
    const normalized = String(inputCaptcha).normalize('NFKC').toLowerCase();
    if (sessionCaptcha.text !== normalized) {
      sessionCaptcha.attempts += 1;
      // M3 — 第 3 次错误时本次仍返回"验证码错误"，下次提交才提示失效
      if (sessionCaptcha.attempts >= 3) {
        delete req.session.captcha;
      }
      return { ok: false, message: '验证码错误' };
    }

    // 验证成功，清除验证码
    delete req.session.captcha;
    return { ok: true, message: '' };
  }
}
