import { test, expect, type Page } from '@playwright/test'

/**
 * 通过路由拦截模拟登录态 + API 响应，避免依赖真实数据库与登录流程。
 * 测试覆盖 Story 2-6 收藏列表页的核心 UI 流程。
 */

async function mockLoggedIn(page: Page) {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        data: { id: 1, username: 'testuser', role: 'user' },
        message: 'ok',
      }),
    })
  })
}

async function mockLoggedOut(page: Page) {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'UNAUTHORIZED', message: '未登录' }),
    })
  })
}

async function mockFavorites(page: Page, favorites: any[], total: number) {
  await page.route(/\/api\/favorites(\?|$)/, async (route) => {
    const url = new URL(route.request().url())
    const pageParam = parseInt(url.searchParams.get('page') || '1', 10)
    const limitParam = parseInt(url.searchParams.get('limit') || '10', 10)
    const start = (pageParam - 1) * limitParam
    const end = start + limitParam
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        data: { favorites: favorites.slice(start, end), total },
        message: 'ok',
      }),
    })
  })
}

async function mockToggleFavorite(page: Page, action: 'added' | 'removed' = 'removed') {
  await page.route('**/api/favorites/*/toggle', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SUCCESS',
        data: { action, isFavorited: action === 'added' },
        message: action === 'removed' ? '已取消收藏' : '已收藏',
      }),
    })
  })
}

test.describe('Story 2-6 收藏列表页 - E2E', () => {
  test('AC #4: 空收藏列表显示空状态提示', async ({ page }) => {
    await mockLoggedIn(page)
    await mockFavorites(page, [], 0)

    await page.goto('/favorites')

    await expect(page.getByText('您还没有收藏任何内容')).toBeVisible()
    // 空状态有 2 个「去浏览内容」按钮（page-header extra + el-empty 内），用 first 即可
    await expect(page.getByRole('button', { name: '去浏览内容' }).first()).toBeVisible()
  })

  test('AC #1 #2: 已登录显示收藏卡片列表（含标题/领域/层级/简介）', async ({ page }) => {
    await mockLoggedIn(page)
    await mockFavorites(page, [
      {
        id: 1,
        domain: 'build',
        level: 2,
        title: 'Docker 容器化部署',
        description: '容器化部署基础',
      },
      {
        id: 2,
        domain: 'server',
        level: 1,
        title: 'Nginx 反向代理',
        description: '配置与优化',
      },
    ], 2)

    await page.goto('/favorites')

    await expect(page.getByText('Docker 容器化部署')).toBeVisible()
    await expect(page.getByText('Nginx 反向代理')).toBeVisible()
    await expect(page.getByText('容器化部署基础')).toBeVisible()
    // 领域标签
    await expect(page.getByText('构建', { exact: true })).toBeVisible()
    await expect(page.getByText('服务器', { exact: true })).toBeVisible()
    // 层级标签
    await expect(page.getByText('Lv2')).toBeVisible()
    await expect(page.getByText('Lv1')).toBeVisible()
  })

  test('AC #3: 点击取消收藏按钮移除卡片 + 提示成功', async ({ page }) => {
    await mockLoggedIn(page)
    await mockFavorites(page, [
      { id: 1, domain: 'build', level: 1, title: 'Item A', description: 'a' },
      { id: 2, domain: 'server', level: 2, title: 'Item B', description: 'b' },
    ], 2)
    await mockToggleFavorite(page, 'removed')

    await page.goto('/favorites')

    await expect(page.getByText('Item A')).toBeVisible()
    await expect(page.getByText('Item B')).toBeVisible()

    // 点击第一个「取消收藏」按钮（用文本定位，element-plus 按钮内可能有多个 span）
    const cancelBtn = page.locator('button').filter({ hasText: '取消收藏' }).first()
    await cancelBtn.click()

    // ElMessage 成功提示
    await expect(page.locator('.el-message').filter({ hasText: '已取消收藏' })).toBeVisible()
    // Item A 应该消失
    await expect(page.getByText('Item A')).toBeHidden()
    // Item B 仍在
    await expect(page.getByText('Item B')).toBeVisible()
  })

  test('AC #5: 未登录用户访问 /favorites 重定向到登录页（携带 redirect query）', async ({ page }) => {
    await mockLoggedOut(page)

    await page.goto('/favorites')

    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
    // vue-router 的 query 序列化可能编码或不编码斜杠，两种都接受
    const url = page.url()
    expect(url.includes('redirect=/favorites') || url.includes('redirect=%2Ffavorites')).toBe(true)
  })

  test('AC #8: 收藏数 > limit 时显示「加载更多」按钮', async ({ page }) => {
    await mockLoggedIn(page)
    const items = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      domain: 'build',
      level: 1,
      title: `Item ${i + 1}`,
      description: 'desc',
    }))
    await mockFavorites(page, items, 15)

    await page.goto('/favorites')

    // 默认显示前 10 条
    await expect(page.getByText('Item 1', { exact: true })).toBeVisible()
    await expect(page.getByText('Item 10')).toBeVisible()
    // 「加载更多」按钮显示
    await expect(page.getByRole('button', { name: '加载更多' })).toBeVisible()
  })

  test('AC #8: 点击「加载更多」加载第二页并追加显示', async ({ page }) => {
    await mockLoggedIn(page)
    const items = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      domain: 'build',
      level: 1,
      title: `Item ${i + 1}`,
      description: 'desc',
    }))
    await mockFavorites(page, items, 15)

    await page.goto('/favorites')

    await expect(page.getByText('Item 10')).toBeVisible()
    // Item 11 此时还未显示
    await expect(page.getByText('Item 11')).toBeHidden()

    await page.getByRole('button', { name: '加载更多' }).click()

    // 第二页内容追加显示
    await expect(page.getByText('Item 11')).toBeVisible()
    await expect(page.getByText('Item 15')).toBeVisible()
    // 第一页内容仍保留（追加而非替换）
    await expect(page.getByText('Item 1', { exact: true })).toBeVisible()
  })
})
