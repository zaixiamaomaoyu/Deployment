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
});
