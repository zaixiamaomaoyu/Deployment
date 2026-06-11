import type { ChatRole } from '@/types/ai-chat'

/**
 * AI 对话 API（SSE 流式调用）
 *
 * 使用原生 fetch + ReadableStream 消费 SSE 流
 * 接口签名保持 AsyncGenerator<string>，与 composable 对齐
 */

/**
 * 获取对话历史
 *
 * 调用后端 GET /api/ai/history，返回最近 50 条记录
 */
export async function fetchChatHistory(): Promise<
  Array<{ role: ChatRole; content: string; created_at: string }>
> {
  const response = await fetch('/api/ai/history', {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHORIZED')
    throw new Error('加载历史记录失败')
  }

  const result = await response.json()
  return result.data.messages
}

/**
 * 清空对话历史
 *
 * 调用后端 DELETE /api/ai/history
 */
export async function clearChatHistory(): Promise<void> {
  const response = await fetch('/api/ai/history', {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHORIZED')
    throw new Error('清空历史记录失败')
  }
}

/**
 * 流式对话接口
 *
 * 发送消息到后端 SSE 端点，逐 chunk 接收 AI 回复
 *
 * @param message - 用户消息内容
 * @param signal - AbortSignal 用于中断请求
 * @param conversationHistory - 对话历史（最近 N 条）
 * @yields 逐字输出的回复内容
 * @throws 网络错误、401 未登录、429 限流、AI 服务错误
 */
export async function* streamChat(
  message: string,
  signal?: AbortSignal,
  conversationHistory?: Array<{ role: string; content: string }>
): AsyncGenerator<string> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 携带 Session Cookie
    body: JSON.stringify({ message, conversationHistory }),
    signal, // 支持中断
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHORIZED');
    if (response.status === 429) throw new Error('RATE_LIMITED');
    throw new Error('AI 服务暂时不可用');
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop()!; // 保留未完成的部分

      for (const line of lines) {
        const data = line.replace(/^data: /, '');
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.content) yield parsed.content;
        } catch (e) {
          if (e instanceof SyntaxError) continue; // 忽略无法解析的行
          throw e;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
