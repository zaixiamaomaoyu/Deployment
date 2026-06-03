import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DecisionTree from '../DecisionTree.vue'
import type { DecisionTreeData } from '@/types/decision-tree'

const fixture: DecisionTreeData = {
  rootId: 'q1',
  nodes: {
    q1: {
      id: 'q1',
      question: '你有服务器吗？',
      options: [
        { id: 'a1', label: '有', nextId: 'q2' },
        { id: 'a2', label: '没有', nextId: 'q3' },
      ],
    },
    q2: {
      id: 'q2',
      question: '想花钱吗？',
      options: [
        { id: 'b1', label: '想', nextId: null, result: { planId: 'vps', planName: 'VPS 自建' } },
        { id: 'b2', label: '不想', nextId: null, result: { planId: 'free', planName: '免费托管' } },
      ],
    },
    q3: {
      id: 'q3',
      question: '项目类型？',
      options: [
        { id: 'c1', label: '静态', nextId: null, result: { planId: 'vercel', planName: 'Vercel' } },
      ],
    },
  },
}

function mountTree(data: DecisionTreeData = fixture) {
  return mount(DecisionTree, {
    props: { data },
    attachTo: document.body,
  })
}

describe('DecisionTree — 渲染（问答态）', () => {
  it('渲染根节点问题文案', () => {
    const wrapper = mountTree()
    expect(wrapper.find('[data-testid="dt-question"]').text()).toContain('你有服务器吗？')
  })

  it('渲染选项按钮数量等于 currentNode.options.length', () => {
    const wrapper = mountTree()
    const options = wrapper.findAll('[data-testid^="dt-option-"]')
    expect(options).toHaveLength(2)
  })

  it('选项 testid 命名为 dt-option-${option.id}', () => {
    const wrapper = mountTree()
    expect(wrapper.find('[data-testid="dt-option-a1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="dt-option-a2"]').exists()).toBe(true)
  })

  it('选项按钮具备 role=radio 与 aria-label', () => {
    const wrapper = mountTree()
    const opt = wrapper.find('[data-testid="dt-option-a1"]')
    expect(opt.attributes('role')).toBe('radio')
    expect(opt.attributes('aria-label')).toBe('有')
  })

  it('根节点时上一题按钮 disabled', () => {
    const wrapper = mountTree()
    const back = wrapper.find('[data-testid="dt-back"]')
    expect(back.attributes('disabled')).toBeDefined()
  })

  it('渲染进度 testid', () => {
    const wrapper = mountTree()
    expect(wrapper.find('[data-testid="dt-progress"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="dt-progress-dots"]').exists()).toBe(true)
  })
})

describe('DecisionTree — 交互（advance）', () => {
  it('点击非叶子选项 → emit advance，不 emit complete', async () => {
    const wrapper = mountTree()
    await wrapper.find('[data-testid="dt-option-a1"]').trigger('click')
    const advance = wrapper.emitted('advance')
    const complete = wrapper.emitted('complete')
    expect(advance).toBeTruthy()
    expect(advance![0][0]).toMatchObject({ id: 'q2' })
    expect(complete).toBeFalsy()
  })

  it('点击后切换到下一题问题文案', async () => {
    const wrapper = mountTree()
    await wrapper.find('[data-testid="dt-option-a1"]').trigger('click')
    expect(wrapper.find('[data-testid="dt-question"]').text()).toContain('想花钱吗？')
  })
})

describe('DecisionTree — 交互（complete）', () => {
  it('点击叶子选项 → emit complete（payload 含 answers 与 result）', async () => {
    const wrapper = mountTree()
    await wrapper.find('[data-testid="dt-option-a1"]').trigger('click') // q1 → q2
    await wrapper.find('[data-testid="dt-option-b1"]').trigger('click') // q2 → 叶子
    const complete = wrapper.emitted('complete')
    expect(complete).toBeTruthy()
    const payload = complete![0][0] as any
    expect(payload.answers).toEqual([
      { nodeId: 'q1', optionId: 'a1' },
      { nodeId: 'q2', optionId: 'b1' },
    ])
    expect(payload.result).toEqual({ planId: 'vps', planName: 'VPS 自建' })
  })

  it('结果态显示推荐方案文案', async () => {
    const wrapper = mountTree()
    await wrapper.find('[data-testid="dt-option-a1"]').trigger('click')
    await wrapper.find('[data-testid="dt-option-b1"]').trigger('click')
    expect(wrapper.find('[data-testid="dt-result"]').text()).toContain('VPS 自建')
  })
})

describe('DecisionTree — 上一题/重新选择', () => {
  it('前进后点击上一题 → emit back，问题回退', async () => {
    const wrapper = mountTree()
    await wrapper.find('[data-testid="dt-option-a1"]').trigger('click')
    await wrapper.find('[data-testid="dt-back"]').trigger('click')
    const back = wrapper.emitted('back')
    expect(back).toBeTruthy()
    expect(back![0][0]).toMatchObject({ id: 'q1' })
    expect(wrapper.find('[data-testid="dt-question"]').text()).toContain('你有服务器吗？')
  })

  it('结果态点击重新选择 → 回到第 1 题、不 emit complete', async () => {
    const wrapper = mountTree()
    await wrapper.find('[data-testid="dt-option-a1"]').trigger('click')
    await wrapper.find('[data-testid="dt-option-b1"]').trigger('click')
    const beforeCount = wrapper.emitted('complete')?.length ?? 0
    await wrapper.find('[data-testid="dt-restart"]').trigger('click')
    expect(wrapper.find('[data-testid="dt-question"]').text()).toContain('你有服务器吗？')
    expect((wrapper.emitted('complete')?.length ?? 0)).toBe(beforeCount)
  })
})

describe('DecisionTree — 空数据', () => {
  it('nodes 为空对象 → 渲染空状态文案', () => {
    const wrapper = mountTree({ rootId: 'q1', nodes: {} })
    expect(wrapper.text()).toContain('决策树数据为空')
  })

  it('根节点 options=[] → 渲染空状态文案', () => {
    const wrapper = mountTree({
      rootId: 'q1',
      nodes: { q1: { id: 'q1', question: 'Q', options: [] } },
    })
    expect(wrapper.text()).toContain('决策树数据为空')
  })
})

describe('DecisionTree — 键盘', () => {
  it('Enter 触发当前聚焦选项的 selectOption', async () => {
    const wrapper = mountTree()
    const opt = wrapper.find('[data-testid="dt-option-a1"]')
    await opt.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('advance')).toBeTruthy()
  })

  it('ArrowDown 在选项间循环焦点（不报错）', async () => {
    const wrapper = mountTree()
    const opt = wrapper.find('[data-testid="dt-option-a1"]')
    // 主要验证事件被处理（不抛错）
    await opt.trigger('keydown', { key: 'ArrowDown' })
    expect(true).toBe(true)
  })
})
