import { Request, Response } from 'express';
import { ContentController } from '../content.controller';
import { ContentsModel } from '../../models/contents.model';

jest.mock('../../models/contents.model');

describe('ContentController.list', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = { query: {} };
    res = {
      json: jsonMock,
      status: statusMock,
    };
    jest.clearAllMocks();
  });

  it('returns contents filtered by domain and level', async () => {
    req.query = { domain: 'build', level: '2' };
    const mockResult = {
      contents: [{ id: 1, title: 'Test', domain: 'build', level: 2 }],
      total: 1,
      page: 1,
      totalPages: 1,
    };
    (ContentsModel.findAll as jest.Mock).mockResolvedValue(mockResult);

    await ContentController.list(req as Request, res as Response);

    expect(ContentsModel.findAll).toHaveBeenCalledWith({
      domain: 'build',
      level: 2,
      page: 1,
      limit: 20,
    });
    expect(jsonMock).toHaveBeenCalledWith({
      code: 'SUCCESS',
      data: mockResult,
      message: '获取内容列表成功',
    });
  });

  it('returns contents filtered by level only', async () => {
    req.query = { level: '3' };
    const mockResult = {
      contents: [{ id: 2, title: 'Test Lv3', domain: 'server', level: 3 }],
      total: 1,
      page: 1,
      totalPages: 1,
    };
    (ContentsModel.findAll as jest.Mock).mockResolvedValue(mockResult);

    await ContentController.list(req as Request, res as Response);

    expect(ContentsModel.findAll).toHaveBeenCalledWith({
      domain: undefined,
      level: 3,
      page: 1,
      limit: 20,
    });
  });

  it('returns 400 for invalid level=0', async () => {
    req.query = { level: '0' };

    await ContentController.list(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      code: 'VALIDATION_ERROR',
      message: '无效的层级参数',
    });
  });

  it('returns 400 for invalid level=abc', async () => {
    req.query = { level: 'abc' };

    await ContentController.list(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      code: 'VALIDATION_ERROR',
      message: '无效的层级参数',
    });
  });

  it('returns 400 for invalid level=6', async () => {
    req.query = { level: '6' };

    await ContentController.list(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      code: 'VALIDATION_ERROR',
      message: '无效的层级参数',
    });
  });

  it('returns all contents when no filters provided', async () => {
    req.query = {};
    const mockResult = {
      contents: [
        { id: 1, title: 'A', domain: 'build', level: 1 },
        { id: 2, title: 'B', domain: 'server', level: 2 },
      ],
      total: 2,
      page: 1,
      totalPages: 1,
    };
    (ContentsModel.findAll as jest.Mock).mockResolvedValue(mockResult);

    await ContentController.list(req as Request, res as Response);

    expect(ContentsModel.findAll).toHaveBeenCalledWith({
      domain: undefined,
      level: undefined,
      page: 1,
      limit: 20,
    });
    expect(jsonMock).toHaveBeenCalledWith({
      code: 'SUCCESS',
      data: mockResult,
      message: '获取内容列表成功',
    });
  });

  it('ignores empty string level', async () => {
    req.query = { level: '' };
    const mockResult = {
      contents: [],
      total: 0,
      page: 1,
      totalPages: 0,
    };
    (ContentsModel.findAll as jest.Mock).mockResolvedValue(mockResult);

    await ContentController.list(req as Request, res as Response);

    expect(ContentsModel.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        level: undefined,
      })
    );
  });

  it('ignores null level', async () => {
    req.query = { level: null as unknown as string };
    const mockResult = {
      contents: [{ id: 1, title: 'Test', domain: 'build', level: 1 }],
      total: 1,
      page: 1,
      totalPages: 1,
    };
    (ContentsModel.findAll as jest.Mock).mockResolvedValue(mockResult);

    await ContentController.list(req as Request, res as Response);

    expect(statusMock).not.toHaveBeenCalledWith(400);
    expect(ContentsModel.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        level: undefined,
      })
    );
  });

  it('returns contents filtered by domain only', async () => {
    req.query = { domain: 'server' };
    const mockResult = {
      contents: [{ id: 1, title: 'Server Test', domain: 'server', level: 2 }],
      total: 1,
      page: 1,
      totalPages: 1,
    };
    (ContentsModel.findAll as jest.Mock).mockResolvedValue(mockResult);

    await ContentController.list(req as Request, res as Response);

    expect(ContentsModel.findAll).toHaveBeenCalledWith({
      domain: 'server',
      level: undefined,
      page: 1,
      limit: 20,
    });
    expect(jsonMock).toHaveBeenCalledWith({
      code: 'SUCCESS',
      data: mockResult,
      message: '获取内容列表成功',
    });
  });

  it('returns contents filtered by search', async () => {
    req.query = { search: 'nginx' };
    const mockResult = {
      contents: [{ id: 1, title: 'Nginx Config', domain: 'server', level: 2 }],
      total: 1,
      page: 1,
      totalPages: 1,
    };
    (ContentsModel.findAll as jest.Mock).mockResolvedValue(mockResult);

    await ContentController.list(req as Request, res as Response);

    expect(ContentsModel.findAll).toHaveBeenCalledWith({
      domain: undefined,
      level: undefined,
      search: 'nginx',
      page: 1,
      limit: 20,
    });
    expect(jsonMock).toHaveBeenCalledWith({
      code: 'SUCCESS',
      data: mockResult,
      message: '获取内容列表成功',
    });
  });

  it('returns contents filtered by domain, level, and search', async () => {
    req.query = { domain: 'build', level: '2', search: 'vite' };
    const mockResult = {
      contents: [{ id: 1, title: 'Vite Build', domain: 'build', level: 2 }],
      total: 1,
      page: 1,
      totalPages: 1,
    };
    (ContentsModel.findAll as jest.Mock).mockResolvedValue(mockResult);

    await ContentController.list(req as Request, res as Response);

    expect(ContentsModel.findAll).toHaveBeenCalledWith({
      domain: 'build',
      level: 2,
      search: 'vite',
      page: 1,
      limit: 20,
    });
    expect(jsonMock).toHaveBeenCalledWith({
      code: 'SUCCESS',
      data: mockResult,
      message: '获取内容列表成功',
    });
  });

  it('ignores empty string search', async () => {
    req.query = { search: '' };
    const mockResult = {
      contents: [],
      total: 0,
      page: 1,
      totalPages: 0,
    };
    (ContentsModel.findAll as jest.Mock).mockResolvedValue(mockResult);

    await ContentController.list(req as Request, res as Response);

    expect(ContentsModel.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        search: undefined,
      })
    );
  });

  it('ignores null search', async () => {
    req.query = { search: null as unknown as string };
    const mockResult = {
      contents: [{ id: 1, title: 'Test', domain: 'build', level: 1 }],
      total: 1,
      page: 1,
      totalPages: 1,
    };
    (ContentsModel.findAll as jest.Mock).mockResolvedValue(mockResult);

    await ContentController.list(req as Request, res as Response);

    expect(statusMock).not.toHaveBeenCalledWith(400);
    expect(ContentsModel.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        search: undefined,
      })
    );
  });

  it('trims search and truncates longer than 100 chars', async () => {
    const longSearch = 'a'.repeat(150);
    req.query = { search: longSearch };
    const mockResult = {
      contents: [],
      total: 0,
      page: 1,
      totalPages: 0,
    };
    (ContentsModel.findAll as jest.Mock).mockResolvedValue(mockResult);

    await ContentController.list(req as Request, res as Response);

    expect(ContentsModel.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'a'.repeat(100),
      })
    );
  });
});
