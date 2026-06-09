import { test, expect, type Page } from '@playwright/test'

/**
 * Story 4-1 AIChat 组件 E2E 测试
 *
 * 通过路由拦截模拟登录态，测试 AI 对话面板的核心 UI 流程。
 * AI 回复使用前端 mock 实现，无需后端。
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

// data-testid 选择器快捷方法
const byTestId = (id: string) => `[data-testid="${id}"]`

test.describe('Story 4-1 AIChat 对话组件 - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await mockLoggedIn(page)
  })

  test('AC #8 #1: 点击悬浮按钮展开 AIChat 面板，显示对话界面', async ({ page }) => {
    await page.goto('/')

    // 悬浮按钮可见
    const triggerBtn = page.locator(byTestId('ac-trigger'))
    await expect(triggerBtn).toBeVisible()

    // 点击打开面板
    await triggerBtn.click()

    // 面板可见
    const panel = page.locator(byTestId('ac-panel'))
    await expect(panel).toBeVisible()

    // 消息区域可见（role=log）
    const messagesArea = page.locator(byTestId('ac-messages'))
    await expect(messagesArea).toBeVisible()
    await expect(messagesArea).toHaveAttribute('role', 'log')
    await expect(messagesArea).toHaveAttribute('aria-live', 'polite')

    // 输入框可见且 placeholder 正确
    const input = page.locator(byTestId('ac-input'))
    await expect(input).toBeVisible()
    await expect(input).toHaveAttribute('placeholder', '有问题可以问我...')

    // 空状态提示
    await expect(page.getByText('有问题可以问我...').first()).toBeVisible()
  })

  test('AC #2: 输入消息并发送，AI 流式回复逐字显示', async ({ page }) => {
    await page.goto('/')

    // 打开面板
    await page.locator(byTestId('ac-trigger')).click()
    await expect(page.locator(byTestId('ac-panel'))).toBeVisible()

    // 输入消息
    const input = page.locator(byTestId('ac-input'))
    await input.fill('你好')

    // 点击发送按钮
    const sendBtn = page.locator(byTestId('ac-send'))
    await sendBtn.click()

    // 用户消息立即显示
    await expect(page.getByText('你好').first()).toBeVisible()

    // AI 回复逐字出现（等待至少部分内容渲染）
    // mock 回复包含「AI 助手」关键词
    await expect(page.getByText(/AI 助手/).first()).toBeVisible({ timeout: 10000 })
  })

  test('AC #8: 再次点击悬浮按钮关闭面板', async ({ page }) => {
    await page.goto('/')

    const triggerBtn = page.locator(byTestId('ac-trigger'))

    // 打开面板
    await triggerBtn.click()
    await expect(page.locator(byTestId('ac-panel'))).toBeVisible()

    // 再次点击关闭面板
    await triggerBtn.click()

    // 面板隐藏（v-show，DOM 仍在但不可见）
    const panel = page.locator(byTestId('ac-panel'))
    await expect(panel).not.toBeVisible()
  })

  test('AC #1: 关闭按钮关闭面板', async ({ page }) => {
    await page.goto('/')

    await page.locator(byTestId('ac-trigger')).click()
    await expect(page.locator(byTestId('ac-panel'))).toBeVisible()

    // 点击关闭按钮
    const closeBtn = page.locator(byTestId('ac-close'))
    await closeBtn.click()

    // 面板隐藏
    await expect(page.locator(byTestId('ac-panel'))).not.toBeVisible()
  })

  test('AC #7: 消息区域 ARIA 无障碍属性', async ({ page }) => {
    await page.goto('/')

    await page.locator(byTestId('ac-trigger')).click()

    const messagesArea = page.locator(byTestId('ac-messages'))
    await expect(messagesArea).toHaveAttribute('role', 'log')
    await expect(messagesArea).toHaveAttribute('aria-live', 'polite')
    await expect(messagesArea).toHaveAttribute('aria-label', 'AI 助手对话')
  })

  test('AC #1: 清空对话按钮功能', async ({ page }) => {
    await page.goto('/')

    await page.locator(byTestId('ac-trigger')).click()

    // 先发送一条消息
    const input = page.locator(byTestId('ac-input'))
    await input.fill('测试消息')
    await page.locator(byTestId('ac-send')).click()

    // 等待用户消息出现
    await expect(page.getByText('测试消息').first()).toBeVisible()

    // 清空按钮出现
    const clearBtn = page.locator(byTestId('ac-clear'))
    await expect(clearBtn).toBeVisible()

    // 点击清空
    await clearBtn.click()

    // 消息清空，回到空状态
    await expect(page.getByText('有问题可以问我...').first()).toBeVisible()
  })
})

test.describe('Story 4-1 AIChat 未登录状态 - E2E', () => {
  test('AC #4: 未登录时显示登录提示和登录按钮', async ({ page }) => {
    await mockLoggedOut(page)
    await page.goto('/')

    // 打开面板
    await page.locator(byTestId('ac-trigger')).click()
    await expect(page.locator(byTestId('ac-panel'))).toBeVisible()

    // 显示登录提示
    const loginHint = page.locator(byTestId('ac-login-hint'))
    await expect(loginHint).toBeVisible()
    await expect(page.getByText('请先登录后使用 AI 助手')).toBeVisible()

    // 输入框不可见（被登录提示替代）
    await expect(page.locator(byTestId('ac-input'))).not.toBeVisible()

    // AIChat 面板内登录按钮可见（NavBar 也有登录按钮，需限定范围）
    await expect(loginHint.getByRole('button', { name: '登录' })).toBeVisible()
  })

  test('AC #4: 点击登录按钮跳转到登录页', async ({ page }) => {
    await mockLoggedOut(page)
    await page.goto('/')

    await page.locator(byTestId('ac-trigger')).click()
    await expect(page.locator(byTestId('ac-login-hint'))).toBeVisible()

    // 点击 AIChat 面板内登录按钮（NavBar 也有登录按钮，需限定范围）
    await page.locator(byTestId('ac-login-hint')).getByRole('button', { name: '登录' }).click()

    // 跳转到登录页
    await page.waitForURL('**/login**')
    expect(page.url()).toContain('/login')
  })
})
