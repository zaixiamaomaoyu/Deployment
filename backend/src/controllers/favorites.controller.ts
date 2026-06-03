import { Request, Response } from 'express';
import { FavoritesModel } from '../models/favorites.model';
import { ContentsModel } from '../models/contents.model';
import { logger } from '../utils/logger';

function parsePositiveContentId(value: unknown): number | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  // 严格仅允许纯数字（拒绝 1e100、0x10、Infinity、前后空白等）
  if (!/^[1-9]\d*$/.test(value)) return null;
  const num = Number(value);
  if (!Number.isSafeInteger(num) || num < 1 || num > 2147483647) return null;
  return num;
}

/**
 * 解析分页参数。
 * - 缺失（undefined / null）→ 返回 default
 * - 数组（如 ?page=1&page=2）→ 直接抛错，禁止静默取首元素
 * - 提供但格式非法（空字符串、非正整数、超出 max、科学计数法、空白等）→ 抛出 RangeError
 */
function parsePaginationParam(
  value: unknown,
  defaultValue: number,
  max: number
): number {
  if (value == null) {
    return defaultValue;
  }

  if (Array.isArray(value)) {
    throw new RangeError('INVALID_FORMAT');
  }

  const strValue = String(value);

  // 严格仅允许纯数字（拒绝 1e2、0x10、Infinity、前后空白、空字符串等）
  if (!/^[1-9]\d*$/.test(strValue)) {
    throw new RangeError('INVALID_FORMAT');
  }

  const num = Number(strValue);
  if (!Number.isSafeInteger(num) || num < 1 || num > max) {
    throw new RangeError('OUT_OF_RANGE');
  }

  return num;
}

export class FavoriteController {
  /**
   * 切换收藏状态
   * POST /api/favorites/:contentId/toggle
   */
  static async toggle(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({
          code: 'UNAUTHORIZED',
          message: '请先登录',
        });
        return;
      }

      const contentId = parsePositiveContentId(req.params.contentId);
      if (contentId === null) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: '无效的内容 ID',
        });
        return;
      }

      const content = await ContentsModel.findById(contentId);
      if (!content) {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: '内容不存在',
        });
        return;
      }

      const result = await FavoritesModel.toggle(userId, contentId);

      res.json({
        code: 'SUCCESS',
        data: result,
        message: result.action === 'added' ? '已收藏' : '已取消收藏',
      });
    } catch (error) {
      logger.error('切换收藏状态失败:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: '收藏操作失败',
      });
    }
  }

  /**
   * 查询收藏状态
   * GET /api/favorites/:contentId/status
   */
  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({
          code: 'UNAUTHORIZED',
          message: '请先登录',
        });
        return;
      }

      const contentId = parsePositiveContentId(req.params.contentId);
      if (contentId === null) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: '无效的内容 ID',
        });
        return;
      }

      const isFavorited = await FavoritesModel.isFavorited(userId, contentId);

      res.json({
        code: 'SUCCESS',
        data: { isFavorited },
        message: '获取收藏状态成功',
      });
    } catch (error) {
      logger.error('获取收藏状态失败:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: '获取收藏状态失败',
      });
    }
  }

  /**
   * 获取收藏列表（带分页）
   * GET /api/favorites?page=1&limit=10
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        res.status(401).json({
          code: 'UNAUTHORIZED',
          message: '请先登录',
        });
        return;
      }

      let page: number;
      let limit: number;
      try {
        page = parsePaginationParam(req.query.page, 1, 100);
        limit = parsePaginationParam(req.query.limit, 10, 100);
      } catch {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'page 和 limit 必须为正整数且不超过 100',
        });
        return;
      }

      const { favorites, total } = await FavoritesModel.findByUser(userId, page, limit);

      res.json({
        code: 'SUCCESS',
        data: { favorites, total },
        message: '获取收藏列表成功',
      });
    } catch (error) {
      logger.error('获取收藏列表失败:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: '获取收藏列表失败',
      });
    }
  }
}
