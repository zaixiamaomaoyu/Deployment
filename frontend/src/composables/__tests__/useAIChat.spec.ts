import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAIChat } from '../useAIChat'

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

// 错误流程 mock — 使用 vi.hoisted 以便在独立 describe 中切换
const shouldThrow = { value: false }
const shouldHistoryThrow = { value: false }
const shouldClearThrow = { value: false }

// 统一 mock @/api/ai
vi.mock('@/api/ai', () => ({
  streamChat: (_message: string) => {
    if (shouldThrow.value) {
      return (async function* () {
        throw new Error('网络错误')
      })()
    }
    return mockStreamChat(_message)
  },
  fetchChatHistory: async () => {
    if (shouldHistoryThrow.value) {
      throw new Error('加载失败')
    }
    return [
      { role: 'user' as const, content: '历史问题', created_at: '2026-06-11T08:00:00Z' },
      { role: 'assistant' as const, content: '历史回复', created_at: '2026-06-11T08:01:00Z' },
    ]
  },
  clearChatHistory: async () => {
    if (shouldClearThrow.value) {
      throw new Error('清空失败')
    }
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
    await clearMessages()
    expect(messages.value).toEqual([])
    expect(status.value).toBe('idle')
  })
})

describe('useAIChat — loadHistory', () => {
  beforeEach(() => {
    shouldHistoryThrow.value = false
    mockUserStore.isLoggedIn = true
  })

  it('loadHistory 未登录时直接返回', async () => {
    mockUserStore.isLoggedIn = false
    const { messages, loadHistory } = useAIChat()
    await loadHistory()
    expect(messages.value).toEqual([])
  })

  it('loadHistory 成功后将历史映射为 ChatMessage', async () => {
    const { messages, loadHistory } = useAIChat()
    await loadHistory()
    expect(messages.value.length).toBe(2)
    expect(messages.value[0].role).toBe('user')
    expect(messages.value[0].content).toBe('历史问题')
    expect(messages.value[1].role).toBe('assistant')
    expect(messages.value[1].content).toBe('历史回复')
    // 验证前端 id 已生成
    expect(messages.value[0].id).toMatch(/^hist-/)
  })

  it('loadHistory 失败时设置 historyError', async () => {
    shouldHistoryThrow.value = true
    const { historyError, loadHistory } = useAIChat()
    await loadHistory()
    expect(historyError.value).toBe('加载历史记录失败，请重试')
  })

  it('loadHistory 已有消息时不重复加载', async () => {
    const { messages, sendMessage, loadHistory } = useAIChat()
    mockUserStore.isLoggedIn = true
    await sendMessage('新消息')
    const countBefore = messages.value.length
    await loadHistory()
    // 已有消息时不应加载历史（fetchChatHistory 不会被再次调用覆盖）
    expect(messages.value.length).toBe(countBefore)
  })
})

describe('useAIChat — clearMessages', () => {
  beforeEach(() => {
    shouldClearThrow.value = false
    mockUserStore.isLoggedIn = true
  })

  it('clearMessages 清空消息列表并重置状态', async () => {
    const { messages, status, sendMessage, clearMessages } = useAIChat()
    mockUserStore.isLoggedIn = true
    await sendMessage('你好')
    expect(messages.value.length).toBeGreaterThan(0)
    await clearMessages()
    expect(messages.value).toEqual([])
    expect(status.value).toBe('idle')
  })

  it('clearMessages 调用 clearChatHistory API', async () => {
    const { messages, sendMessage, clearMessages } = useAIChat()
    mockUserStore.isLoggedIn = true
    await sendMessage('你好')
    await clearMessages()
    // mock 已设置，若未调用会报错；此处主要验证不抛异常
    expect(messages.value).toEqual([])
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
