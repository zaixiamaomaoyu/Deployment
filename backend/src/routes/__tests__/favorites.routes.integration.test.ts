import request from 'supertest';
import { SessionData } from 'express-session';

// Mock DatabaseService 以避免真实 MySQL 连接
jest.mock('../../services/database.service', () => ({
  DatabaseService: {
    query: jest.fn(),
    execute: jest.fn(),
  },
}));

// Mock FavoritesModel（集成测试关注路由 + controller + 中间件链路）
jest.mock('../../models/favorites.model', () => ({
  FavoritesModel: {
    findByUser: jest.fn(),
    toggle: jest.fn(),
    isFavorited: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
    getStats: jest.fn(),
  },
}));

// Mock ContentsModel（toggle 流程会调用 findById）
jest.mock('../../models/contents.model', () => ({
  ContentsModel: {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// 必须在 mock 之后导入 app，确保 env 模块能加载
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'test';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.CLAUDE_API_KEY = 'test';
process.env.SESSION_SECRET = 'test-secret-for-integration';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

import app from '../../app';
import { FavoritesModel } from '../../models/favorites.model';

/**
 * 构造一个 mock session，模拟已登录用户。
 * supertest 默认不保留 cookie，这里通过注入中间件直接设置 req.session。
 */
function buildAppWithSession(sessionData: SessionData | null) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const express = require('express');
  const wrapper = express();
  wrapper.use((req: any, _res: any, next: any) => {
    req.session = sessionData;
    next();
  });
  wrapper.use(app);
  return wrapper;
}

describe('GET /api/favorites - 集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('未登录返回 401 UNAUTHORIZED', async () => {
    const appNoSession = buildAppWithSession(null);

    const res = await request(appNoSession).get('/api/favorites');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      code: 'UNAUTHORIZED',
      message: '请先登录',
    });
    expect(FavoritesModel.findByUser).not.toHaveBeenCalled();
  });

  it('已登录 + 默认参数返回 200 + 分页数据', async () => {
    const appLoggedIn = buildAppWithSession({ userId: 42 } as any);
    (FavoritesModel.findByUser as jest.Mock).mockResolvedValue({
      favorites: [
        { id: 1, domain: 'build', level: 1, title: 'Test', description: 'desc' },
      ],
      total: 1,
    });

    const res = await request(appLoggedIn).get('/api/favorites');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 'SUCCESS',
      data: {
        favorites: [
          { id: 1, domain: 'build', level: 1, title: 'Test', description: 'desc' },
        ],
        total: 1,
      },
      message: '获取收藏列表成功',
    });
    expect(FavoritesModel.findByUser).toHaveBeenCalledWith(42, 1, 10);
  });

  it('已登录 + 自定义 page/limit 透传到 model', async () => {
    const appLoggedIn = buildAppWithSession({ userId: 42 } as any);
    (FavoritesModel.findByUser as jest.Mock).mockResolvedValue({
      favorites: [],
      total: 0,
    });

    const res = await request(appLoggedIn).get('/api/favorites?page=3&limit=20');

    expect(res.status).toBe(200);
    expect(FavoritesModel.findByUser).toHaveBeenCalledWith(42, 3, 20);
  });

  it.each([
    ['page=0', 'page=0'],
    ['page=-1', 'page=-1'],
    ['page=abc', 'page=abc'],
    ['page=1e2', 'page=1e2'],
    ['page=0x10', 'page=0x10'],
    ['limit=101', 'limit=101'],
    ['limit=-1', 'limit=-1'],
    ['limit=abc', 'limit=abc'],
    ['page=空字符串', 'page='],
    ['page=带空白', 'page=%201'],
  ])('非法 query %s 返回 400 VALIDATION_ERROR', async (label, query) => {
    const appLoggedIn = buildAppWithSession({ userId: 42 } as any);

    const res = await request(appLoggedIn).get(`/api/favorites?${query}`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'page 和 limit 必须为正整数且不超过 100',
    });
    expect(FavoritesModel.findByUser).not.toHaveBeenCalled();
  });

  it('数组 query (?page=1&page=2) 返回 400', async () => {
    const appLoggedIn = buildAppWithSession({ userId: 42 } as any);

    const res = await request(appLoggedIn).get('/api/favorites?page=1&page=2');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('边界值 page=100&limit=100 合法', async () => {
    const appLoggedIn = buildAppWithSession({ userId: 42 } as any);
    (FavoritesModel.findByUser as jest.Mock).mockResolvedValue({
      favorites: [],
      total: 0,
    });

    const res = await request(appLoggedIn).get('/api/favorites?page=100&limit=100');

    expect(res.status).toBe(200);
    expect(FavoritesModel.findByUser).toHaveBeenCalledWith(42, 100, 100);
  });

  it('model 抛错返回 500 INTERNAL_ERROR', async () => {
    const appLoggedIn = buildAppWithSession({ userId: 42 } as any);
    (FavoritesModel.findByUser as jest.Mock).mockRejectedValue(new Error('DB down'));

    const res = await request(appLoggedIn).get('/api/favorites');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      code: 'INTERNAL_ERROR',
      message: '获取收藏列表失败',
    });
  });

  it('响应包含正确字段（favorites + total）', async () => {
    const appLoggedIn = buildAppWithSession({ userId: 42 } as any);
    (FavoritesModel.findByUser as jest.Mock).mockResolvedValue({
      favorites: [
        {
          id: 1,
          domain: 'build',
          level: 2,
          title: 'Docker 部署',
          description: '容器化部署基础知识',
          created_at: '2026-06-03T00:00:00.000Z',
          updated_at: '2026-06-03T00:00:00.000Z',
          favorite_id: 100,
          favorited_at: '2026-06-03T00:00:00.000Z',
        },
      ],
      total: 1,
    });

    const res = await request(appLoggedIn).get('/api/favorites');

    expect(res.status).toBe(200);
    expect(res.body.data.favorites[0]).toEqual(
      expect.objectContaining({
        id: 1,
        title: 'Docker 部署',
        domain: 'build',
        level: 2,
      }),
    );
    expect(res.body.data.total).toBe(1);
  });
});
