import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StepGuideView from '../StepGuideView.vue'

// Mock ElMessage
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock copy-to-clipboard
vi.mock('@/utils/copy-to-clipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
}))

describe('StepGuideView', () => {
  function mountView(planId: string) {
    return mount(StepGuideView, {
      props: { planId },
    })
  }

  describe('渲染方案名称和简介', () => {
    it('应该渲染方案名称', async () => {
      const wrapper = mountView('github-pages')
      await wrapper.vm.$nextTick()

      const title = wrapper.find('[data-testid="sg-title"]')
      expect(title.text()).toBe('GitHub Pages')
    })

    it('应该渲染方案简介', async () => {
      const wrapper = mountView('vercel-static')
      await wrapper.vm.$nextTick()

      const intro = wrapper.find('[data-testid="sg-intro"]')
      expect(intro.text()).toContain('Vercel 静态站点免费方案')
    })
  })

  describe('planId 不存在时的错误处理', () => {
    it('planId 不存在时显示错误提示', async () => {
      const wrapper = mountView('invalid-plan-id')
      await wrapper.vm.$nextTick()

      const error = wrapper.find('[data-testid="sg-error"]')
      expect(error.exists()).toBe(true)
      expect(error.text()).toContain('未找到该方案的步骤指南')
    })

    it('planId 不存在时不渲染方案内容', async () => {
      const wrapper = mountView('invalid-plan-id')
      await wrapper.vm.$nextTick()

      const title = wrapper.find('[data-testid="sg-title"]')
      expect(title.exists()).toBe(false)

      const pros = wrapper.find('[data-testid="sg-pros"]')
      expect(pros.exists()).toBe(false)
    })

    it('planId 为空字符串时显示错误提示', async () => {
      const wrapper = mountView('')
      await wrapper.vm.$nextTick()

      const error = wrapper.find('[data-testid="sg-error"]')
      expect(error.exists()).toBe(true)
    })
  })

  describe('testid 全部存在', () => {
    it('所有必需的 testid 应该存在', async () => {
      const wrapper = mountView('github-pages')
      await wrapper.vm.$nextTick()

      const testids = [
        'sg-title',
        'sg-intro',
        'sg-pros',
        'sg-cons',
        'sg-suited-for',
        'sg-back',
        'sg-error',
      ]
      testids.forEach((testid) => {
        const element = wrapper.find(`[data-testid="${testid}"]`)
        expect(element.exists()).toBe(true)
      })
    })
  })

  describe('外部链接渲染', () => {
    it('有 externalUrl 时应该渲染 el-link', async () => {
      const wrapper = mountView('github-pages')
      await wrapper.vm.$nextTick()

      const link = wrapper.find('.sg-external-url .el-link')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('https://pages.github.com')
    })
  })

  describe('代码块和复制按钮', () => {
    it('应该渲染代码块和复制按钮', async () => {
      const wrapper = mountView('github-pages')
      await wrapper.vm.$nextTick()

      const codeBlocks = wrapper.findAll('.sg-code-block')
      expect(codeBlocks.length).toBeGreaterThan(0)

      const copyButtons = wrapper.findAll('.sg-code-block button')
      expect(copyButtons.length).toBeGreaterThan(0)
      expect(copyButtons[0].text()).toBe('一键复制')
    })
  })
})
