import { Request, Response } from 'express';
import { FavoriteController } from '../favorites.controller';
import { FavoritesModel } from '../../models/favorites.model';
import { ContentsModel } from '../../models/contents.model';

jest.mock('../../models/favorites.model');
jest.mock('../../models/contents.model');

describe('FavoriteController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = {
      params: {},
      session: { userId: 1 } as any,
    };
    res = {
      json: jsonMock,
      status: statusMock,
    };
    jest.clearAllMocks();
  });

  describe('toggle', () => {
    it('returns 401 when not logged in', async () => {
      req.session = undefined as any;
      req.params = { contentId: '1' };

      await FavoriteController.toggle(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'UNAUTHORIZED',
        message: '请先登录',
      });
      expect(FavoritesModel.toggle).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid contentId=0', async () => {
      req.params = { contentId: '0' };

      await FavoriteController.toggle(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: '无效的内容 ID',
      });
    });

    it('returns 400 for invalid contentId=-1', async () => {
      req.params = { contentId: '-1' };

      await FavoriteController.toggle(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: '无效的内容 ID',
      });
    });

    it('returns 400 for non-numeric contentId', async () => {
      req.params = { contentId: 'abc' };

      await FavoriteController.toggle(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: '无效的内容 ID',
      });
    });

    it('returns 400 for decimal contentId', async () => {
      req.params = { contentId: '1.5' };

      await FavoriteController.toggle(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: '无效的内容 ID',
      });
    });

    it('returns 400 for hexadecimal contentId', async () => {
      req.params = { contentId: '0x10' };

      await FavoriteController.toggle(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: '无效的内容 ID',
      });
    });

    it('returns 400 for scientific notation contentId', async () => {
      req.params = { contentId: '1e2' };

      await FavoriteController.toggle(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: '无效的内容 ID',
      });
    });

    it('returns 400 for contentId with whitespace', async () => {
      req.params = { contentId: ' 1 ' };

      await FavoriteController.toggle(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: '无效的内容 ID',
      });
    });

    it('returns 400 for unsafe integer contentId', async () => {
      req.params = { contentId: '9999999999999999999' };

      await FavoriteController.toggle(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: '无效的内容 ID',
      });
    });

    it('returns 404 when content does not exist', async () => {
      req.params = { contentId: '999' };
      (ContentsModel.findById as jest.Mock).mockResolvedValue(null);

      await FavoriteController.toggle(req as Request, res as Response);

      expect(ContentsModel.findById).toHaveBeenCalledWith(999);
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'NOT_FOUND',
        message: '内容不存在',
      });
      expect(FavoritesModel.toggle).not.toHaveBeenCalled();
    });

    it('adds favorite when not favorited', async () => {
      req.params = { contentId: '1' };
      (ContentsModel.findById as jest.Mock).mockResolvedValue({ id: 1, title: 'Test' });
      const toggleResult = { action: 'added' as const, isFavorited: true };
      (FavoritesModel.toggle as jest.Mock).mockResolvedValue(toggleResult);

      await FavoriteController.toggle(req as Request, res as Response);

      expect(FavoritesModel.toggle).toHaveBeenCalledWith(1, 1);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'SUCCESS',
        data: toggleResult,
        message: '已收藏',
      });
    });

    it('removes favorite when already favorited', async () => {
      req.params = { contentId: '2' };
      (ContentsModel.findById as jest.Mock).mockResolvedValue({ id: 2, title: 'Test' });
      const toggleResult = { action: 'removed' as const, isFavorited: false };
      (FavoritesModel.toggle as jest.Mock).mockResolvedValue(toggleResult);

      await FavoriteController.toggle(req as Request, res as Response);

      expect(FavoritesModel.toggle).toHaveBeenCalledWith(1, 2);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'SUCCESS',
        data: toggleResult,
        message: '已取消收藏',
      });
    });

    it('returns 500 when model throws', async () => {
      req.params = { contentId: '1' };
      (ContentsModel.findById as jest.Mock).mockResolvedValue({ id: 1, title: 'Test' });
      (FavoritesModel.toggle as jest.Mock).mockRejectedValue(new Error('DB error'));

      await FavoriteController.toggle(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'INTERNAL_ERROR',
        message: '收藏操作失败',
      });
    });

    it('returns 500 when ContentsModel.findById throws', async () => {
      req.params = { contentId: '1' };
      (ContentsModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      await FavoriteController.toggle(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'INTERNAL_ERROR',
        message: '收藏操作失败',
      });
    });
  });

  describe('getStatus', () => {
    it('returns 401 when not logged in', async () => {
      req.session = undefined as any;
      req.params = { contentId: '1' };

      await FavoriteController.getStatus(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'UNAUTHORIZED',
        message: '请先登录',
      });
      expect(FavoritesModel.isFavorited).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid contentId', async () => {
      req.params = { contentId: '0' };

      await FavoriteController.getStatus(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: '无效的内容 ID',
      });
    });

    it('returns isFavorited=true when favorited', async () => {
      req.params = { contentId: '1' };
      (FavoritesModel.isFavorited as jest.Mock).mockResolvedValue(true);

      await FavoriteController.getStatus(req as Request, res as Response);

      expect(FavoritesModel.isFavorited).toHaveBeenCalledWith(1, 1);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'SUCCESS',
        data: { isFavorited: true },
        message: '获取收藏状态成功',
      });
    });

    it('returns isFavorited=false when not favorited', async () => {
      req.params = { contentId: '1' };
      (FavoritesModel.isFavorited as jest.Mock).mockResolvedValue(false);

      await FavoriteController.getStatus(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        code: 'SUCCESS',
        data: { isFavorited: false },
        message: '获取收藏状态成功',
      });
    });

    it('returns 500 when model throws', async () => {
      req.params = { contentId: '1' };
      (FavoritesModel.isFavorited as jest.Mock).mockRejectedValue(new Error('DB error'));

      await FavoriteController.getStatus(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'INTERNAL_ERROR',
        message: '获取收藏状态失败',
      });
    });
  });

  describe('list', () => {
    it('returns 401 when not logged in', async () => {
      req.session = undefined as any;
      req.query = {};

      await FavoriteController.list(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'UNAUTHORIZED',
        message: '请先登录',
      });
      expect(FavoritesModel.findByUser).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid page=0', async () => {
      req.session = { userId: 1 } as any;
      req.query = { page: '0' };

      await FavoriteController.list(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: 'page 和 limit 必须为正整数且不超过 100',
      });
      expect(FavoritesModel.findByUser).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid page=-1', async () => {
      req.session = { userId: 1 } as any;
      req.query = { page: '-1' };

      await FavoriteController.list(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: 'page 和 limit 必须为正整数且不超过 100',
      });
    });

    it('returns 400 for non-numeric page', async () => {
      req.session = { userId: 1 } as any;
      req.query = { page: 'abc' };

      await FavoriteController.list(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: 'page 和 limit 必须为正整数且不超过 100',
      });
    });

    it('returns 400 for invalid limit=-1', async () => {
      req.session = { userId: 1 } as any;
      req.query = { limit: '-1' };

      await FavoriteController.list(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: 'page 和 limit 必须为正整数且不超过 100',
      });
    });

    it('returns 400 for limit > 100', async () => {
      req.session = { userId: 1 } as any;
      req.query = { limit: '101' };

      await FavoriteController.list(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: 'page 和 limit 必须为正整数且不超过 100',
      });
    });

    it('returns 400 for scientific notation limit', async () => {
      req.session = { userId: 1 } as any;
      req.query = { limit: '1e2' };

      await FavoriteController.list(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: 'page 和 limit 必须为正整数且不超过 100',
      });
    });

    it('returns 400 for page with whitespace', async () => {
      req.session = { userId: 1 } as any;
      req.query = { page: ' 1 ' };

      await FavoriteController.list(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: 'page 和 limit 必须为正整数且不超过 100',
      });
    });

    it('returns 400 for hexadecimal limit', async () => {
      req.session = { userId: 1 } as any;
      req.query = { limit: '0x10' };

      await FavoriteController.list(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: 'page 和 limit 必须为正整数且不超过 100',
      });
    });

    it('returns empty array when user has no favorites', async () => {
      req.session = { userId: 1 } as any;
      req.query = { page: '1', limit: '10' };
      (FavoritesModel.findByUser as jest.Mock).mockResolvedValue({
        favorites: [],
        total: 0,
      });

      await FavoriteController.list(req as Request, res as Response);

      expect(FavoritesModel.findByUser).toHaveBeenCalledWith(1, 1, 10);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'SUCCESS',
        data: { favorites: [], total: 0 },
        message: '获取收藏列表成功',
      });
    });

    it('returns paginated favorites when user has favorites', async () => {
      req.session = { userId: 1 } as any;
      req.query = { page: '2', limit: '10' };
      const mockFavorites = [
        { id: 10, title: 'Favorite 10', content: 'content' },
        { id: 11, title: 'Favorite 11', content: 'content' },
      ];
      (FavoritesModel.findByUser as jest.Mock).mockResolvedValue({
        favorites: mockFavorites,
        total: 20,
      });

      await FavoriteController.list(req as Request, res as Response);

      expect(FavoritesModel.findByUser).toHaveBeenCalledWith(1, 2, 10);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'SUCCESS',
        data: { favorites: mockFavorites, total: 20 },
        message: '获取收藏列表成功',
      });
    });

    it('returns 500 when model throws', async () => {
      req.session = { userId: 1 } as any;
      req.query = { page: '1', limit: '10' };
      (FavoritesModel.findByUser as jest.Mock).mockRejectedValue(new Error('DB error'));

      await FavoriteController.list(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'INTERNAL_ERROR',
        message: '获取收藏列表失败',
      });
    });

    it('uses default values when page/limit not provided', async () => {
      req.session = { userId: 1 } as any;
      req.query = {};
      (FavoritesModel.findByUser as jest.Mock).mockResolvedValue({
        favorites: [],
        total: 0,
      });

      await FavoriteController.list(req as Request, res as Response);

      expect(FavoritesModel.findByUser).toHaveBeenCalledWith(1, 1, 10);
    });

    it('uses provided page when specified', async () => {
      req.session = { userId: 1 } as any;
      req.query = { page: '3', limit: '10' } as any;
      (FavoritesModel.findByUser as jest.Mock).mockResolvedValue({
        favorites: [],
        total: 0,
      });

      await FavoriteController.list(req as Request, res as Response);

      expect(FavoritesModel.findByUser).toHaveBeenCalledWith(1, 3, 10);
    });

    it('uses provided limit when specified', async () => {
      req.session = { userId: 1 } as any;
      req.query = { page: '1', limit: '20' } as any;
      (FavoritesModel.findByUser as jest.Mock).mockResolvedValue({
        favorites: [],
        total: 0,
      });

      await FavoriteController.list(req as Request, res as Response);

      expect(FavoritesModel.findByUser).toHaveBeenCalledWith(1, 1, 20);
    });

    it('returns 400 for empty string page', async () => {
      req.session = { userId: 1 } as any;
      req.query = { page: '' };

      await FavoriteController.list(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: 'page 和 limit 必须为正整数且不超过 100',
      });
    });

    it('returns 400 for array page query (?page=1&page=2)', async () => {
      req.session = { userId: 1 } as any;
      req.query = { page: ['1', '2'] } as any;

      await FavoriteController.list(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: 'page 和 limit 必须为正整数且不超过 100',
      });
    });
  });
});
