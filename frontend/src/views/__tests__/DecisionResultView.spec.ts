import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { DecisionTreeCompletePayload } from '@/types/decision-tree'
import DecisionResultView from '../DecisionResultView.vue'

// Mock element-plus
const mockElCard = vi.fn()
const mockElAlert = vi.fn()
const mockElTag = vi.fn()
const mockElButton = vi.fn()

vi.mock('element-plus', () => ({
  ElCard: mockElCard,
  ElAlert: mockElAlert,
  ElTag: mockElTag,
  ElButton: mockElButton,
}))

// Mock deploymentPlans 导入
// Mock deploymentPlans 导入
vi.mock('@/data/deployment-plans', () => ({
  deploymentPlans: {
    'github-pages': {
      planId: 'github-pages',
      planName: 'GitHub Pages',
      category: 'static',
      difficulty: 'beginner',
      priceRange: 'free',
      summary: 'GitHub 官方免费静态托管',
      reason: ['完全免费', '与 Git 工作流深度集成'],
      pros: ['免费', '自动 HTTPS'],
      cons: ['仅支持静态'],
      suitableFor: ['文档站', '个人博客'],
      externalUrl: 'https://pages.github.com',
    },
  },
}))

describe('DecisionResultView', () => {
  const mockPayload: DecisionTreeCompletePayload = {
    answers: [
      { nodeId: 'q1', optionId: 'a1' },
      { nodeId: 'q2', optionId: 'b1' },
    ],
    result: {
      planId: 'github-pages',
      planName: 'GitHub Pages',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockElCard.mockClear()
    mockElAlert.mockClear()
    mockElTag.mockClear()
    mockElButton.mockClear()
  })

  function buildWrapper(payload: DecisionTreeCompletePayload) {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/deployment/decision-tree/result',
          name: 'decision-result',
          component: () => import('../DecisionResultView.vue'),
        },
      ],
    })

    router.push('/deployment/decision-tree/result')

    return mount(DecisionResultView, {
      props: { result: payload },
      global: {
        plugins: [router],
      },
    })
  }

  it('渲染方案名称', () => {
    const wrapper = buildWrapper(mockPayload)
    const title = wrapper.find('[data-testid="dr-result-name"]')
    expect(title.exists()).toBe(true)
    expect(title.text()).toBe('GitHub Pages')
  })

  it('渲染推荐理由', () => {
    const wrapper = buildWrapper(mockPayload)
    const reasons = wrapper.find('[data-testid="dr-reasons"]')
    expect(reasons.exists()).toBe(true)
    expect(reasons.text()).toContain('完全免费')
    expect(reasons.text()).toContain('与 Git 工作流深度集成')
  })

  it('渲染标签（category + difficulty + priceRange）', () => {
    const wrapper = buildWrapper(mockPayload)
    const tags = wrapper.find('[data-testid="dr-tags"]')
    expect(tags.exists()).toBe(true)
    expect(tags.text()).toContain('static')
    expect(tags.text()).toContain('beginner')
    expect(tags.text()).toContain('免费')
  })

  it('渲染适合人群', () => {
    const wrapper = buildWrapper(mockPayload)
    const suitableFor = wrapper.find('[data-testid="dr-suitable-for"]')
    expect(suitableFor.exists()).toBe(true)
    expect(suitableFor.text()).toContain('适合人群：')
    expect(suitableFor.text()).toContain('文档站')
    expect(suitableFor.text()).toContain('个人博客')
  })

  it('planId 不存在时显示错误提示', () => {
    const invalidPayload: DecisionTreeCompletePayload = {
      answers: [],
      result: {
        planId: 'invalid-plan-id',
        planName: 'Invalid Plan',
      },
    }

    const wrapper = buildWrapper(invalidPayload)
    const error = wrapper.find('[data-testid="dr-error"]')
    expect(error.exists()).toBe(true)
    expect(error.text()).toContain('未找到推荐的部署方案')
    expect(error.text()).toContain('重新选择')
  })

  it('点击「查看步骤指南」触发 view-steps emit', async () => {
    const wrapper = buildWrapper(mockPayload)
    const viewStepsBtn = wrapper.find('[data-testid="dr-view-steps"]')
    if (viewStepsBtn.exists()) {
      await viewStepsBtn.trigger('click')
      expect(wrapper.emitted('view-steps')).toBeTruthy()
    }
  })

  it('点击「重新选择」触发 go-back emit', async () => {
    const wrapper = buildWrapper(mockPayload)
    const goBackBtn = wrapper.find('[data-testid="dr-go-back"]')
    if (goBackBtn.exists()) {
      await goBackBtn.trigger('click')
      expect(wrapper.emitted('go-back')).toBeTruthy()
    }
  })

  it('显示加载状态（planId 有效但数据为空）', () => {
    const emptyPayload: DecisionTreeCompletePayload = {
      answers: [],
      result: {
        planId: 'empty-id',
        planName: 'Empty',
      },
    }

    const wrapper = buildWrapper(emptyPayload)
    const title = wrapper.find('[data-testid="dr-result-name"]')
    expect(title.text()).toBe('加载中...')
  })

  it('testid 全部存在', () => {
    const wrapper = buildWrapper(mockPayload)
    const testids = [
      'decision-result',
      'dr-result-name',
      'dr-card',
      'dr-reasons',
      'dr-tags',
      'dr-suitable-for',
      'dr-actions',
      'dr-view-steps',
      'dr-go-back',
    ]

    testids.forEach((id) => {
      const element = wrapper.find(`[data-testid="${id}"]`)
      expect(element.exists()).toBe(true)
    })
  })
})
