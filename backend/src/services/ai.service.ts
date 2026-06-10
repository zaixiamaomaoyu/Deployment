import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
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
 * 用于包装 AI API 调用过程中的各种错误
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
 * 支持多种 AI 提供商：
 * - Claude (Anthropic)
 * - Kimi (Moonshot，兼容 OpenAI 接口)
 * - OpenAI
 *
 * 默认使用 Kimi API（如果配置了有效的 API Key）
 */
export class AIService {
  private static anthropic: Anthropic | null = null;
  private static openai: OpenAI | null = null;

  /**
   * 获取当前 AI 提供商类型
   */
  private static getProvider(): 'claude' | 'kimi' | 'openai' | 'mock' | null {
    const provider = env.AI_PROVIDER?.toLowerCase();
    if (provider === 'claude' || provider === 'kimi' || provider === 'openai' || provider === 'mock') {
      return provider;
    }
    return null;
  }

  /**
   * 获取 Anthropic 实例
   */
  private static getAnthropicInstance(): Anthropic | null {
    if (this.anthropic === null) {
      if (!env.CLAUDE_API_KEY || env.CLAUDE_API_KEY === 'your_claude_api_key') {
        return null;
      }
      this.anthropic = new Anthropic({
        apiKey: env.CLAUDE_API_KEY,
      });
    }
    return this.anthropic;
  }

  /**
   * 获取 OpenAI/Kimi 实例
   */
  private static getOpenAIInstance(): OpenAI | null {
    if (this.openai === null) {
      const apiKey = env.KIMI_API_KEY;
      if (!apiKey || apiKey === 'your_kimi_api_key') {
        return null;
      }
      // 去掉 baseURL 末尾的斜杠，避免双斜杠问题
      const baseURL = env.KIMI_API_URL?.replace(/\/$/, '') || 'https://api.kimi.com/coding';
      this.openai = new OpenAI({
        apiKey: apiKey,
        baseURL: baseURL,
      });
    }
    return this.openai;
  }

  /**
   * 流式对话
   *
   * 根据配置的 AI 提供商调用相应的 API
   *
   * @param message - 用户当前消息
   * @param history - 最近 N 条对话历史（最多 10 条），保持上下文连贯
   * @yields 逐字输出的回复内容
   * @throws {AIServiceError} API 调用失败时抛出
   */
  static async* streamChat(
    message: string,
    history: ChatMessage[] = [],
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    const provider = this.getProvider();

    // 根据提供商调用不同的 API
    if (provider === 'mock') {
      // 显式 Mock 模式
      yield* this.mockStreamChat();
      return;
    }

    if (provider === 'claude') {
      const anthropic = this.getAnthropicInstance();
      if (!anthropic) {
        logger.warn('Claude API Key 未配置，将使用 mock 回复');
        yield* this.mockStreamChat();
        return;
      }
      yield* this.streamChatClaude(message, history, anthropic, signal);
    } else if (provider === 'kimi' || provider === 'openai') {
      const openai = this.getOpenAIInstance();
      if (!openai) {
        logger.warn('Kimi/OpenAI API Key 未配置，将使用 mock 回复');
        yield* this.mockStreamChat();
        return;
      }
      yield* this.streamChatOpenAI(message, history, openai, signal);
    } else {
      // 未配置或配置无效，使用 mock
      logger.warn('AI Provider 未配置或无效，将使用 mock 回复');
      yield* this.mockStreamChat();
    }
  }

  /**
   * Claude 流式对话
   */
  private static async* streamChatClaude(
    message: string,
    history: ChatMessage[],
    anthropic: Anthropic,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    try {
      const stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        signal,
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
   * OpenAI/Kimi 流式对话
   */
  private static async* streamChatOpenAI(
    message: string,
    history: ChatMessage[],
    openai: OpenAI,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    try {
      const model = env.KIMI_MODEL || 'moonshot-v1-8k';

      const stream = await openai.chat.completions.create(
        {
          model: model,
          max_tokens: 2048,
          temperature: 0.7,
          stream: true,
          messages: [
            {
              role: 'system',
              content:
                '你是「前端部署学习助手」，用简体中文回答。回答要通俗易懂，适合前端开发者。如果用户问到部署相关问题，给出实用的建议和示例。',
            },
            ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
            { role: 'user', content: message },
          ],
        },
        { signal }
      );

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      logger.error('Kimi/OpenAI API 调用失败:', {
        message: error instanceof Error ? error.message : String(error),
      });

      throw new AIServiceError(
        `AI 服务调用失败：${error instanceof Error ? error.message : String(error)}`,
        500,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Mock 流式回复（开发阶段使用）
   *
   * 当 AI API Key 未配置时，返回预设的模拟回复
   */
  private static async* mockStreamChat(): AsyncGenerator<string> {
    const mockReply =
      '你好！我是前端部署学习助手。当前 AI API 尚未配置，此为模拟回复。请在 .env 文件中配置有效的 AI API Key（Claude 或 Kimi）后，我将为您提供真实的 AI 服务。';

    for (const char of mockReply) {
      yield char;
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  }
}
