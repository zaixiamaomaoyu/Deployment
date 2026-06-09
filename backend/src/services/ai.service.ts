import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/** 对话历史消息 */
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * AI 服务错误类
 *
 * 用于包装 Claude API 调用过程中的各种错误
 * 提供友好的中文错误消息
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

/**
 * AI 服务
 *
 * 负责调用 Claude API 进行流式对话
 * 使用 @anthropic-ai/sdk 的 messages.stream() 方法
 */
export class AIService {
  private static anthropic: Anthropic | null = null;

  /**
   * 获取 Anthropic 实例
   *
   * 如果 API Key 未配置，返回 null（fallback 到 mock）
   */
  private static getInstance(): Anthropic | null {
    if (this.anthropic === null) {
      // 开发阶段如果 API Key 未配置，返回 null
      if (!env.CLAUDE_API_KEY || env.CLAUDE_API_KEY === 'your_claude_api_key') {
        logger.warn('Claude API Key 未配置，将使用 mock 回复');
        return null;
      }
      this.anthropic = new Anthropic({
        apiKey: env.CLAUDE_API_KEY,
      });
    }
    return this.anthropic;
  }

  /**
   * 流式对话
   *
   * 调用 Claude API 并逐 chunk 返回响应
   *
   * @param message - 用户当前消息
   * @param history - 最近 N 条对话历史（最多 10 条），保持上下文连贯
   * @yields 逐字输出的回复内容
   * @throws {AIServiceError} API 调用失败时抛出
   */
  static async* streamChat(
    message: string,
    history: ChatMessage[] = []
  ): AsyncGenerator<string> {
    const anthropic = this.getInstance();

    // 如果 API 未配置，使用 mock 回复
    if (!anthropic) {
      yield* this.mockStreamChat();
      return;
    }

    try {
      const stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system:
          '你是「前端部署学习助手」，用简体中文回答。回答要通俗易懂，适合前端开发者。如果用户问到部署相关问题，给出实用的建议和示例。',
        messages: [
          ...history.map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: message },
        ],
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield event.delta.text;
        }
      }
    } catch (error) {
      // 安全：仅记录错误消息和状态码，不记录完整错误对象（可能包含 API Key）
      logger.error('Claude API 调用失败:', {
        message: error instanceof Error ? error.message : String(error),
        status: error instanceof Anthropic.APIError ? error.status : undefined,
      });

      if (error instanceof Anthropic.APIError) {
        throw new AIServiceError(
          `AI 服务调用失败：${error.message}`,
          error.status,
          error
        );
      }

      throw new AIServiceError(
        'AI 服务暂时不可用，请稍后再试',
        500,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Mock 流式回复（开发阶段使用）
   *
   * 当 Claude API Key 未配置时，返回预设的模拟回复
   */
  private static async* mockStreamChat(): AsyncGenerator<string> {
    const mockReply =
      '你好！我是前端部署学习助手。当前 Claude API 尚未配置，此为模拟回复。请在 .env 文件中配置 CLAUDE_API_KEY 后，我将为您提供真实的 AI 服务。';

    for (const char of mockReply) {
      yield char;
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  }
}
