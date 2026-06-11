import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { streamChat } from '@/api/ai'
import type { ChatMessage, AIChatStatus } from '@/types/ai-chat'

/**
 * AI 对话 composable
 *
 * 管理消息列表、AI 回复状态、发送/重试/清空等操作
 * composable 与组件分离，便于测试和复用
 */
export function useAIChat() {
  const userStore = useUserStore()
  const messages = ref<ChatMessage[]>([])
  const status = ref<AIChatStatus>('idle')
  let abortController: AbortController | null = null // 用于中断 SSE 流

  /** 生成唯一消息 ID */
  function generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  /**
   * 发送消息并触发 AI 流式回复
   *
   * 未登录时静默返回，组件层负责显示登录提示
   * 流式回复使用 for await...of 消费 AsyncGenerator
   */
  async function sendMessage(content: string) {
    if (!userStore.isLoggedIn) return
    if (status.value === 'streaming') return

    // 添加用户消息
    messages.value.push({
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    })

    // 创建 AI 消息占位
    const aiMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }
    messages.value.push(aiMessage)
    status.value = 'streaming'

    // 记录 AI 消息在数组中的索引，通过响应式 Proxy 修改才能触发 UI 更新
    const aiMessageIndex = messages.value.length - 1

    // 创建 AbortController 用于中断
    abortController = new AbortController()

    // 构建对话历史（最近 10 条，不包括当前消息）
    const conversationHistory = messages.value
      .filter((msg) => msg.id !== aiMessage.id) // 排除当前的 AI 占位消息
      .slice(-10)
      .map((msg) => ({ role: msg.role, content: msg.content }))

    try {
      for await (const chunk of streamChat(content, abortController?.signal, conversationHistory)) {
        messages.value[aiMessageIndex].content += chunk
      }
      status.value = 'idle'
    } catch (error) {
      // 统一在 catch 中处理中断和错误
      if (
        (error instanceof DOMException && error.name === 'AbortError') ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        messages.value[aiMessageIndex].aborted = true
        status.value = 'idle'
      } else {
        messages.value[aiMessageIndex].error = true
        messages.value[aiMessageIndex].content = 'AI 助手暂时不可用，请稍后再试'
        status.value = 'error'
      }
    } finally {
      abortController = null
    }
  }

  /** 清空对话历史 */
  function clearMessages() {
    // 先中断流式输出，避免访问已清空的消息数组
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    messages.value = []
    status.value = 'idle'
  }

  /**
   * 停止当前流式输出
   *
   * 调用 AbortController 中断 SSE 流
   */
  function stopStreaming() {
    if (abortController && status.value === 'streaming') {
      abortController.abort()
      // 注意：状态更新在 sendMessage 的 catch 中处理
    }
  }

  /** 重试上一条失败的消息（不追加重复用户消息） */
  async function retryLast() {
    if (status.value === 'streaming') return

    // 查找最后一条用户消息
    const lastUserMsg = [...messages.value].reverse().find((m) => m.role === 'user')
    if (!lastUserMsg) return

    // 移除最后一条 AI 消息（可能包含错误）
    const lastIndex = messages.value.length - 1
    if (lastIndex >= 0 && messages.value[lastIndex].role === 'assistant') {
      messages.value.splice(lastIndex, 1)
    }

    // 创建新的 AI 消息占位，直接调用流式接口而不追加用户消息
    const aiMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }
    messages.value.push(aiMessage)
    status.value = 'streaming'

    // 记录 AI 消息在数组中的索引，通过响应式 Proxy 修改才能触发 UI 更新
    const aiMessageIndex = messages.value.length - 1

    // 创建 AbortController 用于中断
    abortController = new AbortController()

    // 构建对话历史（最近 10 条，不包括当前消息）
    const conversationHistory = messages.value
      .filter((msg) => msg.id !== aiMessage.id) // 排除当前的 AI 占位消息
      .slice(-10)
      .map((msg) => ({ role: msg.role, content: msg.content }))

    try {
      for await (const chunk of streamChat(lastUserMsg.content, abortController?.signal, conversationHistory)) {
        messages.value[aiMessageIndex].content += chunk
      }
      status.value = 'idle'
    } catch (error) {
      // 统一在 catch 中处理中断和错误
      if (
        (error instanceof DOMException && error.name === 'AbortError') ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        messages.value[aiMessageIndex].aborted = true
        status.value = 'idle'
      } else {
        messages.value[aiMessageIndex].error = true
        messages.value[aiMessageIndex].content = 'AI 助手暂时不可用，请稍后再试'
        status.value = 'error'
      }
    } finally {
      abortController = null
    }
  }

  return { messages, status, sendMessage, clearMessages, retryLast, stopStreaming }
}
