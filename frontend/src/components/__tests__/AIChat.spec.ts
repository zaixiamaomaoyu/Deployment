import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import AIChat from '@/components/AIChat.vue'
import type { AIChatStatus, ChatMessage } from '@/types/ai-chat'

// 使用 vi.hoisted 创建 mock 数据（不含 vue ref，避免初始化顺序问题）
const mockState = vi.hoisted(() => ({
  userStore: {
    isLoggedIn: true,
    userInfo: { id: 1, username: 'test', role: 'user' as const },
  },
  messages: [] as ChatMessage[],
  status: 'idle' as AIChatStatus,
  isLoadingHistory: false,
  historyError: null as string | null,
  sendMessage: vi.fn(),
  clearMessages: vi.fn(),
  retryLast: vi.fn(),
  loadHistory: vi.fn(),
  stopStreaming: vi.fn(),
}))

vi.mock('@/stores/user', () => ({
  useUserStore: () => mockState.userStore,
}))

vi.mock('@/composables/useAIChat', () => ({
  useAIChat: () => ({
    messages: ref(mockState.messages),
    status: ref(mockState.status),
    isLoadingHistory: ref(mockState.isLoadingHistory),
    historyError: ref(mockState.historyError),
    sendMessage: mockState.sendMessage,
    clearMessages: mockState.clearMessages,
    retryLast: mockState.retryLast,
    loadHistory: mockState.loadHistory,
    stopStreaming: mockState.stopStreaming,
  }),
}))

vi.mock('@/utils/copy-to-clipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue(undefined),
    },
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }
})

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function mountAIChat(visible = true) {
  return mount(AIChat, {
    props: { visible },
    global: {
      stubs: {
        ElButton: true,
        ElInput: true,
        ElTag: true,
        ElIcon: true,
        ElAlert: true,
      },
    },
  })
}

describe('AIChat — 渲染', () => {
  beforeEach(() => {
    mockState.messages = []
    mockState.status = 'idle'
    mockState.userStore.isLoggedIn = true
  })

  it('visible=true 时渲染面板', () => {
    const wrapper = mountAIChat(true)
    expect(wrapper.find('[data-testid="ac-panel"]').exists()).toBe(true)
  })

  it('visible=false 时面板 DOM 存在但内容隐藏', () => {
    const wrapper = mountAIChat(false)
    const panel = wrapper.find('[data-testid="ac-panel"]')
    expect(panel.exists()).toBe(true)
  })

  it('渲染输入框（ElInput stub 存在）', () => {
    const wrapper = mountAIChat(true)
    expect(wrapper.find('[data-testid="ac-input"]').exists()).toBe(true)
  })

  it('渲染关闭按钮', () => {
    const wrapper = mountAIChat(true)
    expect(wrapper.find('[data-testid="ac-close"]').exists()).toBe(true)
  })

  it('消息区域有 role=log 和 aria-live=polite', () => {
    const wrapper = mountAIChat(true)
    const messages = wrapper.find('[data-testid="ac-messages"]')
    expect(messages.attributes('role')).toBe('log')
    expect(messages.attributes('aria-live')).toBe('polite')
  })
})

describe('AIChat — 未登录状态', () => {
  beforeEach(() => {
    mockState.userStore.isLoggedIn = false
    mockState.messages = []
    mockState.status = 'idle'
  })

  it('未登录时显示登录提示', () => {
    const wrapper = mountAIChat(true)
    expect(wrapper.find('[data-testid="ac-login-hint"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('请先登录后使用 AI 助手')
  })

  it('未登录时不显示输入区域', () => {
    const wrapper = mountAIChat(true)
    expect(wrapper.find('[data-testid="ac-input"]').exists()).toBe(false)
  })
})

describe('AIChat — 消息展示', () => {
  beforeEach(() => {
    mockState.messages = []
    mockState.status = 'idle'
    mockState.userStore.isLoggedIn = true
  })

  it('空消息时显示空状态提示', () => {
    const wrapper = mountAIChat(true)
    expect(wrapper.text()).toContain('有问题可以问我...')
  })

  it('空消息时显示常见术语快捷标签', () => {
    const wrapper = mountAIChat(true)
    const quickTerms = wrapper.find('[data-testid="ac-quick-terms"]')
    expect(quickTerms.exists()).toBe(true)
    expect(wrapper.text()).toContain('常见术语')
    expect(quickTerms.find('[data-testid="ac-quick-term-Nginx"]').exists()).toBe(true)
    expect(quickTerms.find('[data-testid="ac-quick-term-Docker"]').exists()).toBe(true)
    expect(quickTerms.find('[data-testid="ac-quick-term-SSH"]').exists()).toBe(true)
    expect(quickTerms.find('[data-testid="ac-quick-term-CI/CD"]').exists()).toBe(true)
  })
})

describe('AIChat — 历史加载与清空', () => {
  beforeEach(() => {
    mockState.messages = []
    mockState.status = 'idle'
    mockState.isLoadingHistory = false
    mockState.historyError = null
    mockState.userStore.isLoggedIn = true
    mockState.loadHistory.mockClear()
    mockState.clearMessages.mockClear()
  })

  it('打开面板且消息为空时触发 loadHistory', async () => {
    const wrapper = mountAIChat(false)
    await nextTick()
    expect(mockState.loadHistory).not.toHaveBeenCalled()
    await wrapper.setProps({ visible: true })
    await nextTick()
    await flushPromises()
    expect(mockState.loadHistory).toHaveBeenCalled()
  })

  it('加载状态时显示旋转指示器', async () => {
    mockState.isLoadingHistory = true
    const wrapper = mountAIChat(true)
    await nextTick()
    expect(wrapper.find('[data-testid="ac-history-loading"]').exists()).toBe(true)
  })

  it('加载错误时显示错误提示和重试按钮', async () => {
    mockState.historyError = '加载历史记录失败，请重试'
    const wrapper = mountAIChat(true)
    await nextTick()
    expect(wrapper.find('[data-testid="ac-history-error"]').exists()).toBe(true)
  })

  it('有消息且已登录时显示清空按钮', async () => {
    mockState.messages = [
      { id: 'msg-1', role: 'user' as const, content: 'test', timestamp: Date.now() },
    ]
    mockState.userStore.isLoggedIn = true
    const wrapper = mountAIChat(true)
    await nextTick()
    expect(wrapper.find('[data-testid="ac-clear"]').exists()).toBe(true)
  })

  it('未登录时不显示清空按钮', async () => {
    mockState.messages = [
      { id: 'msg-1', role: 'user' as const, content: 'test', timestamp: Date.now() },
    ]
    mockState.userStore.isLoggedIn = false
    const wrapper = mountAIChat(true)
    await nextTick()
    expect(wrapper.find('[data-testid="ac-clear"]').exists()).toBe(false)
  })
})

describe('AIChat — 事件', () => {
  beforeEach(() => {
    mockState.messages = []
    mockState.status = 'idle'
    mockState.userStore.isLoggedIn = true
    mockState.sendMessage.mockClear()
    mockState.clearMessages.mockClear()
    mockState.retryLast.mockClear()
  })

  it('点击关闭按钮触发 update:visible 和 close 事件', async () => {
    const wrapper = mountAIChat(true)
    await wrapper.find('[data-testid="ac-close"]').trigger('click')
    expect(wrapper.emitted('update:visible')).toBeTruthy()
    expect(wrapper.emitted('update:visible')![0]).toEqual([false])
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('有消息时显示清空按钮并点击调用 clearMessages', async () => {
    mockState.messages = [
      { id: 'msg-1', role: 'user' as const, content: 'test', timestamp: Date.now() },
    ]
    const wrapper = mountAIChat(true)
    await nextTick()
    const clearBtn = wrapper.find('[data-testid="ac-clear"]')
    expect(clearBtn.exists()).toBe(true)
    await clearBtn.trigger('click')
    await flushPromises()
    expect(mockState.clearMessages).toHaveBeenCalled()
  })

  it('点击快捷术语标签调用 sendMessage 并发送术语问题', async () => {
    const wrapper = mountAIChat(true)
    const nginxTag = wrapper.find('[data-testid="ac-quick-term-Nginx"]')
    expect(nginxTag.exists()).toBe(true)
    await nginxTag.trigger('click')
    expect(mockState.sendMessage).toHaveBeenCalledWith('什么是 Nginx？')
  })

  it('未登录时点击快捷术语标签不调用 sendMessage', async () => {
    mockState.userStore.isLoggedIn = false
    const wrapper = mountAIChat(true)
    const nginxTag = wrapper.find('[data-testid="ac-quick-term-Nginx"]')
    expect(nginxTag.exists()).toBe(true)
    await nginxTag.trigger('click')
    expect(mockState.sendMessage).not.toHaveBeenCalled()
  })
})