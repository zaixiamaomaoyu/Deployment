import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ElMessage } from 'element-plus'
import StepGuideView from '../StepGuideView.vue'
import { deploymentPlanSteps } from '@/data/deployment-plan-steps'
import { copyToClipboard } from '@/utils/copy-to-clipboard'

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
  async function mountView(planId: string) {
    const wrapper = mount(StepGuideView, {
      props: { planId },
    })
    await flushPromises()
    return wrapper
  }

  describe('渲染方案名称和简介', () => {
    it('应该渲染方案名称', async () => {
      const wrapper = await mountView('github-pages')

      const title = wrapper.find('[data-testid="sg-title"]')
      expect(title.text()).toBe('GitHub Pages')
    })

    it('应该渲染方案简介', async () => {
      const wrapper = await mountView('vercel-static')

      const intro = wrapper.find('[data-testid="sg-intro"]')
      expect(intro.text()).toContain('Vercel 静态站点免费方案')
    })
  })

  describe('真实步骤渲染', () => {
    it('应该渲染该方案的所有步骤', async () => {
      const wrapper = await mountView('github-pages')

      const steps = deploymentPlanSteps['github-pages']
      for (let idx = 0; idx < steps.length; idx++) {
        const stepEl = wrapper.find(`[data-testid="sg-step-${idx}"]`)
        expect(stepEl.exists()).toBe(true)
        expect(stepEl.text()).toContain(steps[idx].title)
        expect(stepEl.text()).toContain(steps[idx].description)
      }
    })

    it('应该渲染总预计耗时', async () => {
      const wrapper = await mountView('github-pages')

      const totalTime = wrapper.find('[data-testid="sg-total-time"]')
      expect(totalTime.exists()).toBe(true)

      const expectedTotal = deploymentPlanSteps['github-pages'].reduce(
        (sum, step) => sum + (step.estimatedMinutes || 0),
        0,
      )
      expect(totalTime.text()).toContain(String(expectedTotal))
    })

    it('不包含 command 的步骤不显示复制按钮', async () => {
      const wrapper = await mountView('github-pages')
      const steps = deploymentPlanSteps['github-pages']

      for (let idx = 0; idx < steps.length; idx++) {
        const stepEl = wrapper.find(`[data-testid="sg-step-${idx}"]`)
        const copyButton = stepEl.find(`[data-testid="sg-copy-${idx}"]`)
        if (steps[idx].command) {
          expect(copyButton.exists()).toBe(true)
        } else {
          expect(copyButton.exists()).toBe(false)
        }
      }
    })

    it('包含 command 的步骤显示代码块和复制按钮', async () => {
      const wrapper = await mountView('github-pages')

      const copyButton = wrapper.find('[data-testid="sg-copy-0"]')
      expect(copyButton.exists()).toBe(true)
      expect(copyButton.text()).toBe('一键复制')

      const codeBlock = wrapper.find('[data-testid="sg-step-0"] .sg-code-block')
      expect(codeBlock.exists()).toBe(true)
    })

    it('应该渲染步骤预计耗时', async () => {
      const wrapper = await mountView('github-pages')

      const steps = deploymentPlanSteps['github-pages']
      for (let idx = 0; idx < steps.length; idx++) {
        if (steps[idx].estimatedMinutes) {
          const timeEl = wrapper.find(`[data-testid="sg-step-time-${idx}"]`)
          expect(timeEl.exists()).toBe(true)
          expect(timeEl.text()).toContain(`${steps[idx].estimatedMinutes} 分钟`)
        }
      }
    })
  })

  describe('planId 不存在时的错误处理', () => {
    it('planId 不存在时显示错误提示', async () => {
      const wrapper = await mountView('invalid-plan-id')

      const error = wrapper.find('[data-testid="sg-error"]')
      expect(error.exists()).toBe(true)
      expect(error.text()).toContain('未找到该方案的步骤指南')
    })

    it('planId 不存在时不渲染方案内容', async () => {
      const wrapper = await mountView('invalid-plan-id')

      const title = wrapper.find('[data-testid="sg-title"]')
      expect(title.exists()).toBe(false)

      const pros = wrapper.find('[data-testid="sg-pros"]')
      expect(pros.exists()).toBe(false)
    })

    it('planId 为空字符串时显示错误提示', async () => {
      const wrapper = await mountView('')

      const error = wrapper.find('[data-testid="sg-error"]')
      expect(error.exists()).toBe(true)
    })
  })

  describe('testid 全部存在', () => {
    it('正常状态下的必需 testid 应该存在', async () => {
      const wrapper = await mountView('github-pages')

      const testids = [
        'sg-title',
        'sg-intro',
        'sg-pros',
        'sg-cons',
        'sg-suited-for',
        'sg-back',
        'sg-total-time',
        'sg-step-0',
        'sg-step-time-0',
        'sg-copy-0',
        'sg-external-link',
      ]
      for (const testid of testids) {
        const element = wrapper.find(`[data-testid="${testid}"]`)
        expect(element.exists()).toBe(true)
      }
    })

    it('错误状态下的必需 testid 应该存在', async () => {
      const wrapper = await mountView('invalid-plan-id')

      const error = wrapper.find('[data-testid="sg-error"]')
      expect(error.exists()).toBe(true)

      const backButton = wrapper.find('[data-testid="sg-back"]')
      expect(backButton.exists()).toBe(true)
    })
  })

  describe('外部链接渲染', () => {
    it('有 externalUrl 时应该渲染 el-link', async () => {
      const wrapper = await mountView('github-pages')

      const link = wrapper.find('[data-testid="sg-external-link"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('https://pages.github.com')
    })
  })

  describe('复制按钮交互', () => {
    it('点击复制按钮应该调用 copyToClipboard', async () => {
      const wrapper = await mountView('github-pages')

      const copyButton = wrapper.find('[data-testid="sg-copy-0"]')
      expect(copyButton.exists()).toBe(true)

      await copyButton.trigger('click')

      expect(copyToClipboard).toHaveBeenCalled()
    })

    it('复制失败时显示错误提示并保持“一键复制”状态', async () => {
      vi.mocked(copyToClipboard).mockRejectedValueOnce(new Error('copy failed'))

      const wrapper = await mountView('github-pages')
      const copyButton = wrapper.find('[data-testid="sg-copy-0"]')
      expect(copyButton.text()).toBe('一键复制')

      await copyButton.trigger('click')
      await flushPromises()

      expect(copyToClipboard).toHaveBeenCalled()
      expect(ElMessage.error).toHaveBeenCalledWith('复制失败，请手动复制')
      expect(copyButton.text()).toBe('一键复制')
    })
  })
})
