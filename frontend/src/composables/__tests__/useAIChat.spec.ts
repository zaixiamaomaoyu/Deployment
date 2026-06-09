import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAIChat } from '../useAIChat'
import type { ChatMessage } from '@/types/ai-chat'

// Mock useUserStore
const mockUserStore = {
  isLoggedIn: true,
  userInfo: { id: 1, username: 'test', role: 'user' },
}

vi.mock('@/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))

// Mock streamChat API — 正常流程
async function* mockStreamChat(_message: string): AsyncGenerator<string> {
  const reply = '模拟AI回复'
  for (const char of reply) {
    yield char
  }
}

vi.mock('@/api/ai', () => ({
  streamChat: (_message: string) => mockStreamChat(_message),
}))

// 错误流程 mock — 使用 vi.hoisted 以便在独立 describe 中切换
const shouldThrow = { value: false }

// 覆盖 @/api/ai mock 以支持错误场景
vi.mock('@/api/ai', () => ({
  streamChat: (_message: string) => {
    if (shouldThrow.value) {
      return (async function* () {
        throw new Error('网络错误')
      })()
    }
    return mockStreamChat(_message)
  },
}))

describe('useAIChat — 初始状态', () => {
  it('messages 初始为空数组', () => {
    const { messages } = useAIChat()
    expect(messages.value).toEqual([])
  })

  it('status 初始为 idle', () => {
    const { status } = useAIChat()
    expect(status.value).toBe('idle')
  })
})

describe('useAIChat — sendMessage', () => {
  beforeEach(() => {
    mockUserStore.isLoggedIn = true
  })

  it('sendMessage 添加用户消息到列表', async () => {
    const { messages, sendMessage } = useAIChat()
    await sendMessage('你好')
    const userMsg = messages.value.find((m) => m.role === 'user')
    expect(userMsg).toBeDefined()
    expect(userMsg!.content).toBe('你好')
    expect(userMsg!.role).toBe('user')
  })

  it('sendMessage 触发流式回复，AI 消息逐字追加', async () => {
    const { messages, sendMessage, status } = useAIChat()
    await sendMessage('测试消息')
    const aiMsg = messages.value.find((m) => m.role === 'assistant')
    expect(aiMsg).toBeDefined()
    expect(aiMsg!.content).toBe('模拟AI回复')
    expect(status.value).toBe('idle')
  })

  it('未登录时 sendMessage 不添加消息', async () => {
    mockUserStore.isLoggedIn = false
    const { messages, sendMessage } = useAIChat()
    await sendMessage('你好')
    expect(messages.value).toEqual([])
  })
})

describe('useAIChat — sendMessage 错误处理', () => {
  beforeEach(() => {
    mockUserStore.isLoggedIn = true
    shouldThrow.value = false
  })

  it('streamChat 抛出错误时设置 error 状态和友好文案', async () => {
    shouldThrow.value = true
    const { messages, sendMessage, status } = useAIChat()
    await sendMessage('触发错误')
    const aiMsg = messages.value.find((m) => m.role === 'assistant')
    expect(aiMsg).toBeDefined()
    expect(aiMsg!.error).toBe(true)
    expect(aiMsg!.content).toBe('AI 助手暂时不可用，请稍后再试')
    expect(status.value).toBe('error')
  })

  it('错误后 clearMessages 重置状态', async () => {
    shouldThrow.value = true
    const { messages, sendMessage, status, clearMessages } = useAIChat()
    await sendMessage('触发错误')
    expect(status.value).toBe('error')
    clearMessages()
    expect(messages.value).toEqual([])
    expect(status.value).toBe('idle')
  })
})

describe('useAIChat — clearMessages', () => {
  it('clearMessages 清空消息列表并重置状态', async () => {
    const { messages, status, sendMessage, clearMessages } = useAIChat()
    mockUserStore.isLoggedIn = true
    await sendMessage('你好')
    expect(messages.value.length).toBeGreaterThan(0)
    clearMessages()
    expect(messages.value).toEqual([])
    expect(status.value).toBe('idle')
  })
})

describe('useAIChat — retryLast', () => {
  beforeEach(() => {
    shouldThrow.value = false
    mockUserStore.isLoggedIn = true
  })

  it('retryLast 移除错误的 AI 消息并重新发送（不追加重复用户消息）', async () => {
    const { messages, sendMessage, retryLast } = useAIChat()
    mockUserStore.isLoggedIn = true
    await sendMessage('第一条')
    const msgCountBefore = messages.value.length
    await retryLast()
    // retryLast 移除了最后一条 AI 消息，然后直接调用流式接口添加新 AI 消息
    // 总消息数 = msgCountBefore - 1 (移除旧AI) + 1 (新AI) = msgCountBefore
    expect(messages.value.length).toBe(msgCountBefore)
    // 最后一条消息是新的 AI 回复
    const lastMsg = messages.value[messages.value.length - 1]
    expect(lastMsg.role).toBe('assistant')
    expect(lastMsg.content).toBe('模拟AI回复')
    expect(lastMsg.error).toBeFalsy()
  })

  it('没有用户消息时 retryLast 不执行操作', async () => {
    const { messages, retryLast } = useAIChat()
    await retryLast()
    expect(messages.value).toEqual([])
  })
})
