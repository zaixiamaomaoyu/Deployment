import { Request, Response } from 'express';
import { ContentsModel } from '../models/contents.model';
import { logger } from '../utils/logger';

const VALID_DOMAINS = ['build', 'platform', 'server', 'automation', 'domain', 'container'];

function parsePositiveInt(value: unknown, defaultValue: number, max?: number): number {
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isInteger(num) || num < 1) {
    return defaultValue;
  }
  return max !== undefined && num > max ? max : num;
}

export class ContentController {
  /**
   * 获取知识内容列表
   * GET /api/contents?domain=&page=&limit=
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const { domain, page = '1', limit = '20' } = req.query;

      // 验证 domain 白名单
      const domainStr = domain as string | undefined;
      if (domainStr && !VALID_DOMAINS.includes(domainStr)) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: '无效的领域参数',
        });
        return;
      }

      const parsedPage = parsePositiveInt(page, 1);
      const parsedLimit = parsePositiveInt(limit, 20, 100);

      const result = await ContentsModel.findAll({
        domain: domainStr,
        page: parsedPage,
        limit: parsedLimit,
      });

      res.json({
        code: 'SUCCESS',
        data: result,
        message: '获取内容列表成功',
      });
    } catch (error) {
      logger.error('获取内容列表失败:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: '获取内容列表失败',
      });
    }
  }

  /**
   * 根据 ID 获取内容详情
   * GET /api/contents/:id
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id) || !Number.isInteger(id) || id < 1) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: '无效的内容 ID',
        });
        return;
      }

      const content = await ContentsModel.findById(id);

      if (!content) {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: '内容不存在',
        });
        return;
      }

      res.json({
        code: 'SUCCESS',
        data: content,
        message: '获取内容详情成功',
      });
    } catch (error) {
      logger.error('获取内容详情失败:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: '获取内容详情失败',
      });
    }
  }
}
