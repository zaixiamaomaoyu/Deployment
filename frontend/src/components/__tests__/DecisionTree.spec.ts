import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
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

function mountTree(data: DecisionTreeData = fixture, initialNodeId?: string) {
  return mount(DecisionTree, {
    props: initialNodeId ? { data, initialNodeId } : { data },
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

  it('选项按钮具备 role=button 与 aria-label（F1 决策：role=button）', () => {
    const wrapper = mountTree()
    const opt = wrapper.find('[data-testid="dt-option-a1"]')
    expect(opt.attributes('role')).toBe('button')
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

describe('DecisionTree — 键盘（F2/F10/F11）', () => {
  it('ArrowDown 将焦点移到下一个 option（F10: 真实焦点断言）', async () => {
    const wrapper = mountTree()
    const opt1 = wrapper.find('[data-testid="dt-option-a1"]').element as HTMLElement
    const opt2 = wrapper.find('[data-testid="dt-option-a2"]').element as HTMLElement
    opt1.focus()
    expect(document.activeElement).toBe(opt1)
    await wrapper.find('[data-testid="dt-option-a1"]').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(document.activeElement).toBe(opt2)
  })

  it('ArrowDown 在单选项节点不报错也不失焦（F11）', async () => {
    const wrapper = mountTree()
    // q3 只有 1 个 option，先前进到 q3
    await wrapper.find('[data-testid="dt-option-a2"]').trigger('click') // q1 → q3
    const opt = wrapper.find('[data-testid="dt-option-c1"]').element as HTMLElement
    opt.focus()
    expect(document.activeElement).toBe(opt)
    await wrapper.find('[data-testid="dt-option-c1"]').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    // 单选项：nextIndex === index 早返，焦点保持
    expect(document.activeElement).toBe(opt)
  })

  it('Enter 不再触发 keydown 处理（F2: 删除 Enter/Space 分支，依赖原生 click）', async () => {
    const wrapper = mountTree()
    const opt = wrapper.find('[data-testid="dt-option-a1"]')
    // keydown Enter 不应触发 advance（让原生 click 处理）
    await opt.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('advance')).toBeFalsy()
    // 触发原生 click 才推进
    await opt.trigger('click')
    expect(wrapper.emitted('advance')).toBeTruthy()
  })
})

describe('DecisionTree — 快速连点防护（F12）', () => {
  it('快速连点同一 option 不会重复 emit advance', async () => {
    const wrapper = mountTree()
    const opt = wrapper.find('[data-testid="dt-option-a1"]')
    // 同步连发 3 次 click（不 await，模拟真实快速连点）
    void opt.trigger('click')
    void opt.trigger('click')
    void opt.trigger('click')
    await nextTick()
    const advance = wrapper.emitted('advance')
    // 第一次推进成功，后续被 isTransitioning 锁拦截
    expect(advance?.length ?? 0).toBe(1)
  })
})

describe('DecisionTree — initialNodeId prop（F5）', () => {
  it('传入 initialNodeId 时从指定节点启动', () => {
    const wrapper = mountTree(fixture, 'q2')
    expect(wrapper.find('[data-testid="dt-question"]').text()).toContain('想花钱吗？')
  })

  it('initialNodeId 指向不存在节点时回退到 rootId', () => {
    const wrapper = mountTree(fixture, 'missing')
    expect(wrapper.find('[data-testid="dt-question"]').text()).toContain('你有服务器吗？')
  })
})
