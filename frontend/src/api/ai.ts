/**
 * AI 对话 API（mock 实现）
 *
 * Story 4-2 将替换为真实 SSE 流式调用
 * 接口签名使用 AsyncGenerator<string>，与后续 SSE 实现对齐
 */

/** mock 回复预设文案 */
const MOCK_REPLIES: string[] = [
  '这是 AI 助手的模拟回复。在后续版本中，这里将接入真实的 AI 服务，为您提供专业的部署问题解答。',
  '您好！我目前处于演示模式，暂时无法回答真实的部署问题。正式版本上线后，我可以帮您解答部署相关的疑问，解释技术术语，并提供故障排查建议。',
  '感谢您的提问！当前 AI 助手仍在开发中，此回复为模拟数据。敬请期待完整版本，届时我将为您提供全方位的部署学习支持。',
]

/**
 * 流式对话接口（mock）
 *
 * @param message - 用户消息内容
 * @yields 逐字输出的回复内容
 */
export async function* streamChat(message: string): AsyncGenerator<string> {
  // 根据 message 长度选择不同回复，增加多样性
  const reply = MOCK_REPLIES[message.length % MOCK_REPLIES.length]
  for (const char of reply) {
    yield char
    await new Promise((resolve) => setTimeout(resolve, 30))
  }
}
