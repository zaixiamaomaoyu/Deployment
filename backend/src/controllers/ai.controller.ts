import { Request, Response } from 'express';
import { AIService, AIServiceError } from '../services/ai.service';
import { ChatLogsModel } from '../models/chat-logs.model';
import {
  setSSEHeaders,
  sendSSEData,
  sendSSEError,
  sendSSEEnd,
  registerClientDisconnect,
} from '../middlewares/sse.middleware';
import { logger } from '../utils/logger';

/** 对话历史消息接口 */
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * AI 对话控制器
 *
 * 处理 AI 对话请求，返回 SSE 流式响应
 * 处理对话历史查询与清空
 */
export class AIController {
  /**
   * AI 对话端点
   *
   * POST /api/ai/chat
   *
   * 请求体：
   * - message: string（必填，最大 2000 字符）
   * - conversationHistory: ChatMessage[]（可选，最近 N 条对话历史）
   *
   * 响应：SSE 流式响应
   */
  static async chat(req: Request, res: Response): Promise<void> {
    const { message, conversationHistory } = req.body;

    // 1. 请求体验证
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        code: 'MISSING_FIELDS',
        message: '消息内容不能为空',
      });
      return;
    }

    if (message.length > 2000) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: '消息内容不能超过2000字',
      });
      return;
    }

    // 验证对话历史格式（如果提供）
    let history: ChatMessage[] = [];
    if (conversationHistory && Array.isArray(conversationHistory)) {
      // 只取最近 10 条，使用类型守卫确保类型安全
      history = conversationHistory
        .filter((msg: unknown): msg is ChatMessage => {
          if (typeof msg !== 'object' || msg === null) return false;
          const m = msg as Record<string, unknown>;
          return (
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string'
          );
        })
        .slice(-10);
    }

    // 2. 认证校验（必须在设置 SSE 头之前，否则无法返回 JSON 错误）
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: '请先登录',
      });
      return;
    }

    const cleanMessage = message.trim();

    // 3. 设置 SSE 响应头
    setSSEHeaders(res);

    // 4. 异步记录用户消息
    ChatLogsModel.insert(userId, 'user', cleanMessage).catch((err) =>
      logger.error('记录用户消息失败:', err)
    );

    // 5. 创建中止控制器（用于客户端断连时中止流）
    const abortController = new AbortController();
    registerClientDisconnect(req, abortController);

    // 6. 调用 AIService 流式输出
    let fullReply = '';
    try {
      const stream = AIService.streamChat(cleanMessage, history, abortController.signal);

      for await (const chunk of stream) {
        fullReply += chunk;
        sendSSEData(res, { content: chunk });
      }

      // 7. 流结束，发送 [DONE]
      sendSSEEnd(res);

      // 8. 异步记录 AI 回复
      ChatLogsModel.insert(userId, 'assistant', fullReply).catch((err) =>
        logger.error('记录 AI 回复失败:', err)
      );
    } catch (error) {
      logger.error('AI 对话流式输出失败:', error);

      if (error instanceof AIServiceError) {
        sendSSEError(res, error.message);
      } else {
        sendSSEError(res, 'AI 服务暂时不可用');
      }

      sendSSEEnd(res);
    }
  }

  /**
   * 获取对话历史
   *
   * GET /api/ai/history
   *
   * 返回当前用户最近 50 条对话记录
   */
  static async getHistory(req: Request, res: Response): Promise<void> {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: '请先登录',
      });
      return;
    }

    try {
      const messages = await ChatLogsModel.findByUserId(userId, 50);
      res.json({
        code: 'SUCCESS',
        data: { messages },
      });
    } catch (error) {
      logger.error('获取对话历史失败:', error);
      res.status(500).json({ code: 'INTERNAL_ERROR', message: '获取对话历史失败' });
    }
  }

  /**
   * 清空对话历史
   *
   * DELETE /api/ai/history
   *
   * 删除当前用户的所有对话记录
   */
  static async clearHistory(req: Request, res: Response): Promise<void> {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: '请先登录',
      });
      return;
    }

    try {
      await ChatLogsModel.deleteByUserId(userId);
      res.json({ code: 'SUCCESS', message: '对话历史已清空' });
    } catch (error) {
      logger.error('清空对话历史失败:', error);
      res.status(500).json({ code: 'INTERNAL_ERROR', message: '清空对话历史失败' });
    }
  }
}
