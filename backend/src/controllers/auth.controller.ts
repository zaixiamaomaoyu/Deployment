import { Request, Response } from 'express';
import { env } from '../config/env';
import { UsersModel } from '../models/users.model';
import { WechatService } from '../services/wechat.service';
import { logger } from '../utils/logger';

const wechatService = new WechatService(env.WECHAT_APP_ID, env.WECHAT_APP_SECRET);

export class AuthController {
  /**
   * 微信 OAuth 回调
   * GET /api/auth/wechat/callback?code=xxx
   */
  static async wechatCallback(req: Request, res: Response): Promise<void> {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: '缺少授权码 code' });
      return;
    }

    try {
      // 1. 用 code 换取 access_token 和 openid
      const tokenData = await wechatService.getAccessToken(code);

      // 2. 查询或创建用户
      let user = await UsersModel.findByOpenId(tokenData.openid);

      if (!user) {
        // 尝试获取用户信息（不阻塞登录流程）
        let nickname: string | null = null;
        let avatarUrl: string | null = null;

        try {
          const userInfo = await wechatService.getUserInfo(tokenData.access_token, tokenData.openid);
          nickname = userInfo.nickname || null;
          avatarUrl = userInfo.headimgurl || null;
        } catch {
          logger.warn('获取微信用户信息失败，使用默认值');
        }

        const userId = await UsersModel.create({
          openid: tokenData.openid,
          nickname: nickname ?? undefined,
          avatar_url: avatarUrl ?? undefined,
          role: 'user',
        });

        user = await UsersModel.findById(userId);
      }

      if (!user) {
        res.status(500).json({ error: '用户创建失败' });
        return;
      }

      // 3. 设置 session
      req.session.userId = user.id;

      // 4. 返回用户信息
      res.json({
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        role: user.role,
      });
    } catch (error) {
      logger.error('微信登录失败:', error);
      res.status(500).json({
        error: '登录失败',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  /**
   * 获取当前登录用户信息
   * GET /api/auth/me
   */
  static async me(req: Request, res: Response): Promise<void> {
    const userId = req.session?.userId;

    if (!userId) {
      res.status(401).json({ error: '未登录' });
      return;
    }

    const user = await UsersModel.findById(userId);

    if (!user) {
      res.status(401).json({ error: '用户不存在' });
      return;
    }

    res.json({
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatar_url: user.avatar_url,
      role: user.role,
    });
  }

  /**
   * 退出登录
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    req.session?.destroy((err) => {
      if (err) {
        logger.error('退出登录失败:', err);
        res.status(500).json({ error: '退出登录失败' });
        return;
      }
      res.json({ message: '已退出登录' });
    });
  }
}
