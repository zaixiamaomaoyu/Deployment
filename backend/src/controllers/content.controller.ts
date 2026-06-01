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

function parseLevel(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isInteger(num) || num < 1 || num > 5) {
    return undefined;
  }
  return num;
}

function parseSearch(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'object') return undefined;
  const str = String(value).trim();
  if (str.length === 0) return undefined;
  if (str.length > 100) return str.slice(0, 100);
  return str;
}

export class ContentController {
  /**
   * 获取知识内容列表
   * GET /api/contents?domain=&page=&limit=
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const { domain, level, search, page = '1', limit = '20' } = req.query;

      // 验证 domain 白名单
      const domainStr = domain as string | undefined;
      if (domainStr && !VALID_DOMAINS.includes(domainStr)) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: '无效的领域参数',
        });
        return;
      }

      const parsedLevel = parseLevel(level);
      if (level != null && level !== '' && parsedLevel === undefined) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: '无效的层级参数',
        });
        return;
      }

      const parsedSearch = parseSearch(search);

      const parsedPage = parsePositiveInt(page, 1);
      const parsedLimit = parsePositiveInt(limit, 20, 100);

      const result = await ContentsModel.findAll({
        domain: domainStr,
        level: parsedLevel,
        search: parsedSearch,
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

  /**
   * 获取相邻内容（上一篇/下一篇）
   * GET /api/contents/:id/neighbors
   */
  static async getNeighbors(req: Request, res: Response): Promise<void> {
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

      const neighbors = await ContentsModel.findNeighbors(id);

      res.json({
        code: 'SUCCESS',
        data: neighbors,
        message: '获取相邻内容成功',
      });
    } catch (error) {
      logger.error('获取相邻内容失败:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: '获取相邻内容失败',
      });
    }
  }
}
