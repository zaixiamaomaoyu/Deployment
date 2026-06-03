import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import type { Content } from '@/api/contents'

// vi.hoisted 让变量在 vi.mock 工厂中可用（mock 会被提升到文件顶部）
const { mockListFavorites, mockToggleFavorite, mockLogout, mockElMessage } = vi.hoisted(() => ({
  mockListFavorites: vi.fn(),
  mockToggleFavorite: vi.fn(),
  mockLogout: vi.fn(),
  mockElMessage: Object.assign(vi.fn(), {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/api/favorites', () => ({
  listFavorites: (...args: any[]) => mockListFavorites(...args),
  toggleFavorite: (...args: any[]) => mockToggleFavorite(...args),
}))

vi.mock('@/stores/user', async () => {
  const { defineStore } = await import('pinia')
  return {
    useUserStore: defineStore('user', () => ({
      userInfo: { id: 1, username: 'test', role: 'user' } as any,
      isLoggedIn: true,
      isAdmin: false,
      fetchUserInfo: vi.fn(),
      setUser: vi.fn(),
      logout: mockLogout,
    })),
  }
})

vi.mock('element-plus', async (importOriginal) => {
  const actual: any = await importOriginal()
  return { ...actual, ElMessage: mockElMessage }
})

// 在 mock 之后导入组件
import FavoritesView from '../FavoritesView.vue'

function buildRouter(initialPath = '/favorites') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div/>' } },
      { path: '/favorites', name: 'Favorites', component: FavoritesView },
      { path: '/login', name: 'Login', component: { template: '<div data-testid="login-page"/>' } },
      { path: '/contents/:id', name: 'ContentDetail', component: { template: '<div/>' } },
      { path: '/contents', name: 'Contents', component: { template: '<div/>' } },
    ],
  })
  router.push(initialPath)
  return router
}

async function mountView(initialPath = '/favorites') {
  setActivePinia(createPinia())
  const router = buildRouter(initialPath)
  await router.isReady()
  const wrapper = mount(FavoritesView, {
    global: {
      plugins: [router, createPinia()],
      stubs: {
        ContentCard: {
          props: ['content'],
          emits: ['click'],
          template:
            '<div class="card-stub" :data-id="content.id">{{ content.title }}<slot name="extra" /></div>',
        },
        ElButton: {
          props: ['type', 'loading', 'disabled', 'size', 'icon'],
          template: '<button :disabled="disabled"><slot /></button>',
        },
        ElEmpty: {
          props: ['description'],
          template: '<div class="empty-stub">{{ description }}</div>',
        },
        ElPageHeader: { template: '<div class="page-header-stub"><slot name="content" /><slot name="extra" /></div>' },
        ElIcon: { template: '<i />' },
      },
    },
  })
  return { wrapper, router }
}

function makeContent(overrides: Partial<Content> = {}): Content {
  return {
    id: 1,
    domain: 'build',
    level: 1,
    title: 'Test Content',
    description: 'desc',
    created_at: '2026-06-03T00:00:00.000Z',
    updated_at: '2026-06-03T00:00:00.000Z',
    ...overrides,
  } as Content
}

describe('FavoritesView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListFavorites.mockReset()
    mockToggleFavorite.mockReset()
    mockLogout.mockReset()
    mockElMessage.success.mockReset()
    mockElMessage.warning.mockReset()
    mockElMessage.error.mockReset()
  })

  it('挂载后调用 listFavorites(page=1, limit=10, signal)', async () => {
    mockListFavorites.mockResolvedValue({
      code: 'SUCCESS',
      data: { favorites: [makeContent({ id: 1, title: 'A' })], total: 1 },
      message: 'ok',
    })

    await mountView()
    await flushPromises()

    expect(mockListFavorites).toHaveBeenCalledWith(1, 10, expect.any(AbortSignal))
  })

  it('空收藏列表渲染空状态文案（AC #4）', async () => {
    mockListFavorites.mockResolvedValue({
      code: 'SUCCESS',
      data: { favorites: [], total: 0 },
      message: 'ok',
    })

    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('您还没有收藏任何内容')
  })

  it('点击「加载更多」递增 page 并追加合并（AC #8）', async () => {
    const page1 = Array.from({ length: 10 }, (_, i) => makeContent({ id: i + 1, title: `Item ${i + 1}` }))
    const page2 = Array.from({ length: 5 }, (_, i) => makeContent({ id: i + 11, title: `Item ${i + 11}` }))
    mockListFavorites
      .mockResolvedValueOnce({ code: 'SUCCESS', data: { favorites: page1, total: 15 }, message: 'ok' })
      .mockResolvedValueOnce({ code: 'SUCCESS', data: { favorites: page2, total: 15 }, message: 'ok' })

    const { wrapper } = await mountView()
    await flushPromises()

    expect(mockListFavorites).toHaveBeenLastCalledWith(1, 10, expect.any(AbortSignal))

    const loadMoreBtn = wrapper.findAll('button').find((b) => b.text().includes('加载更多'))
    expect(loadMoreBtn).toBeTruthy()
    await loadMoreBtn!.trigger('click')
    await flushPromises()

    expect(mockListFavorites).toHaveBeenLastCalledWith(2, 10, expect.any(AbortSignal))
    expect(mockListFavorites).toHaveBeenCalledTimes(2)
  })

  it('toggleFavorite removed 时从列表移除该卡片（AC #3）', async () => {
    mockListFavorites.mockResolvedValue({
      code: 'SUCCESS',
      data: {
        favorites: [
          makeContent({ id: 100, title: 'Fav 100' }),
          makeContent({ id: 101, title: 'Fav 101' }),
        ],
        total: 2,
      },
      message: 'ok',
    })
    mockToggleFavorite.mockResolvedValue({
      code: 'SUCCESS',
      data: { action: 'removed', isFavorited: false },
      message: 'ok',
    })

    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Fav 100')

    // 通过 vm 直接访问内部状态/方法，避免 .stop 修饰符在 stub 上的兼容问题
    const vm = wrapper.vm as any
    await vm.handleToggleFavorite(makeContent({ id: 100, title: 'Fav 100' }))
    await flushPromises()

    expect(mockToggleFavorite).toHaveBeenCalledWith(100)
    expect(wrapper.text()).not.toContain('Fav 100')
    expect(wrapper.text()).toContain('Fav 101')
    expect(mockElMessage.success).toHaveBeenCalledWith('已取消收藏')
  })

  it('快速连续调用 handleToggleFavorite 同一内容只触发一次（AC #9 防竞态）', async () => {
    mockListFavorites.mockResolvedValue({
      code: 'SUCCESS',
      data: { favorites: [makeContent({ id: 100 })], total: 1 },
      message: 'ok',
    })
    // 让 toggle 请求挂起（模拟慢请求）
    mockToggleFavorite.mockReturnValue(new Promise(() => {}))

    const { wrapper } = await mountView()
    await flushPromises()

    const vm = wrapper.vm as any
    const content = makeContent({ id: 100 })
    // 同步触发 3 次（不 await，让挂起的 promise 保持 pending）
    vm.handleToggleFavorite(content)
    vm.handleToggleFavorite(content)
    vm.handleToggleFavorite(content)
    await flushPromises()

    expect(mockToggleFavorite).toHaveBeenCalledTimes(1)
  })

  it('API 401 触发 logout + 跳转登录页（AC #6）', async () => {
    mockListFavorites.mockRejectedValue({
      name: 'AxiosError',
      response: { status: 401 },
    })

    const { router } = await mountView()
    await flushPromises()

    expect(mockLogout).toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/favorites')
  })

  it('handleCardClick 跳转到 /contents/:id（AC #2）', async () => {
    mockListFavorites.mockResolvedValue({
      code: 'SUCCESS',
      data: { favorites: [makeContent({ id: 42 })], total: 1 },
      message: 'ok',
    })

    const { wrapper, router } = await mountView()
    await flushPromises()

    const vm = wrapper.vm as any
    vm.handleCardClick(makeContent({ id: 42 }))
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/contents/42')
  })
})
