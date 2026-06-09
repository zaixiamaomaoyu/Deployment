/**
 * AI 对话 API（SSE 流式调用）
 *
 * 使用原生 fetch + ReadableStream 消费 SSE 流
 * 接口签名保持 AsyncGenerator<string>，与 composable 对齐
 */

/**
 * 流式对话接口
 *
 * 发送消息到后端 SSE 端点，逐 chunk 接收 AI 回复
 *
 * @param message - 用户消息内容
 * @yields 逐字输出的回复内容
 * @throws 网络错误、401 未登录、429 限流、AI 服务错误
 */
export async function* streamChat(message: string): AsyncGenerator<string> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 携带 Session Cookie
    body: JSON.stringify({ message }),
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
