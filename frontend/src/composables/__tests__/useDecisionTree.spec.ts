import { describe, it, expect, vi } from 'vitest'
import { useDecisionTree } from '../useDecisionTree'
import type { DecisionTreeData } from '@/types/decision-tree'

// 最小 fixture：根 → 2 分支 → 各 2 叶子（共 3 层）
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
        { id: 'c2', label: 'SSR', nextId: null, result: { planId: 'railway', planName: 'Railway' } },
      ],
    },
  },
}

describe('useDecisionTree — 初始状态', () => {
  it('currentNode 默认指向 rootId', () => {
    const { currentNode, isRoot } = useDecisionTree(fixture)
    expect(currentNode.value?.id).toBe('q1')
    expect(isRoot.value).toBe(true)
  })

  it('answers 初始为空数组', () => {
    const { answers } = useDecisionTree(fixture)
    expect(answers.value).toEqual([])
  })

  it('canGoBack 在根节点为 false', () => {
    const { canGoBack } = useDecisionTree(fixture)
    expect(canGoBack.value).toBe(false)
  })

  it('isFinished 初始为 false', () => {
    const { isFinished } = useDecisionTree(fixture)
    expect(isFinished.value).toBe(false)
  })
})

describe('useDecisionTree — initialNodeId 参数（F5）', () => {
  it('传入 initialNodeId 时从指定节点启动', () => {
    const { currentNode, isRoot } = useDecisionTree(fixture, 'q2')
    expect(currentNode.value?.id).toBe('q2')
    expect(isRoot.value).toBe(false)
  })

  it('initialNodeId 指向不存在节点时回退到 rootId', () => {
    const { currentNode } = useDecisionTree(fixture, 'missing')
    expect(currentNode.value?.id).toBe('q1')
  })
})

describe('useDecisionTree — selectOption 非叶子', () => {
  it('点击非叶子选项 → 返回 advance，currentNodeId 更新', () => {
    const state = useDecisionTree(fixture)
    const outcome = state.selectOption(fixture.nodes.q1.options[0])
    expect(outcome).toEqual({ type: 'advance', nextNode: fixture.nodes.q2 })
    expect(state.currentNodeId.value).toBe('q2')
    expect(state.answers.value).toEqual([{ nodeId: 'q1', optionId: 'a1' }])
    expect(state.isRoot.value).toBe(false)
    expect(state.canGoBack.value).toBe(true)
  })
})

describe('useDecisionTree — selectOption 叶子', () => {
  it('点击叶子选项 → 返回 complete payload（含 answers 与 result）', () => {
    const state = useDecisionTree(fixture)
    state.selectOption(fixture.nodes.q1.options[0]) // q1 → q2
    const outcome = state.selectOption(fixture.nodes.q2.options[0]) // q2 → 叶子
    expect(outcome?.type).toBe('complete')
    if (outcome?.type === 'complete') {
      expect(outcome.payload.answers).toEqual([
        { nodeId: 'q1', optionId: 'a1' },
        { nodeId: 'q2', optionId: 'b1' },
      ])
      expect(outcome.payload.result).toEqual({ planId: 'vps', planName: 'VPS 自建' })
    }
    expect(state.isFinished.value).toBe(true)
  })
})

describe('useDecisionTree — 叶子无 result（F3 单独分支）', () => {
  it('叶子无 result → 返回 null，answers 回滚，warn 文案准确', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const data: DecisionTreeData = {
      rootId: 'q1',
      nodes: {
        q1: {
          id: 'q1',
          question: 'Q1',
          options: [{ id: 'a1', label: 'A', nextId: null }], // nextId=null 但无 result
        },
      },
    }
    const state = useDecisionTree(data)
    const outcome = state.selectOption(data.nodes.q1.options[0])
    expect(outcome).toBeNull()
    expect(state.answers.value).toEqual([])
    expect(state.isFinished.value).toBe(false)
    // F3: warn 文案应包含「是叶子但缺少 result」
    expect(warnSpy.mock.calls[0][0]).toContain('是叶子但缺少 result')
    warnSpy.mockRestore()
  })
})

describe('useDecisionTree — nextId 指向不存在节点', () => {
  it('返回 null，answers 不变，console.warn 被调用', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const broken: DecisionTreeData = {
      rootId: 'q1',
      nodes: {
        q1: {
          id: 'q1',
          question: 'Q1',
          options: [{ id: 'a1', label: 'A', nextId: 'missing' }],
        },
      },
    }
    const state = useDecisionTree(broken)
    const outcome = state.selectOption(broken.nodes.q1.options[0])
    expect(outcome).toBeNull()
    expect(state.answers.value).toEqual([])
    expect(state.currentNodeId.value).toBe('q1')
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})

describe('useDecisionTree — goBack（F8 显式守卫）', () => {
  it('根节点调用 goBack 返回 null，状态不变', () => {
    const state = useDecisionTree(fixture)
    expect(state.goBack()).toBeNull()
    expect(state.currentNodeId.value).toBe('q1')
    expect(state.answers.value).toEqual([])
  })

  it('第 2 题调用 goBack → answers 弹出、currentNodeId 回退、isFinished 重置', () => {
    const state = useDecisionTree(fixture)
    state.selectOption(fixture.nodes.q1.options[0]) // → q2
    const prev = state.goBack()
    expect(prev?.id).toBe('q1')
    expect(state.currentNodeId.value).toBe('q1')
    expect(state.answers.value).toEqual([])
    expect(state.canGoBack.value).toBe(false)
  })

  it('结果态调用 goBack → isFinished 重置为 false', () => {
    const state = useDecisionTree(fixture)
    state.selectOption(fixture.nodes.q1.options[0]) // q1 → q2
    state.selectOption(fixture.nodes.q2.options[0]) // q2 → 叶子（finished）
    expect(state.isFinished.value).toBe(true)
    state.goBack()
    expect(state.isFinished.value).toBe(false)
  })

  it('answers 为空数组时 goBack 不抛错（F8 守卫）', () => {
    const state = useDecisionTree(fixture)
    // 直接清空 answers 模拟并发场景
    state.answers.value = []
    expect(state.goBack()).toBeNull()
  })
})

describe('useDecisionTree — reset', () => {
  it('reset 后回到根节点、answers 清空、isFinished 重置', () => {
    const state = useDecisionTree(fixture)
    state.selectOption(fixture.nodes.q1.options[0])
    state.reset()
    expect(state.currentNodeId.value).toBe('q1')
    expect(state.answers.value).toEqual([])
    expect(state.isRoot.value).toBe(true)
    expect(state.isFinished.value).toBe(false)
  })

  it('initialNodeId 启动时 reset 回到 initialNodeId 而非 rootId', () => {
    const state = useDecisionTree(fixture, 'q2')
    state.selectOption(fixture.nodes.q2.options[0]) // 推进到叶子
    state.reset()
    expect(state.currentNodeId.value).toBe('q2')
  })
})

describe('useDecisionTree — empty 数据', () => {
  it('nodes 为空对象 → empty=true', () => {
    const empty: DecisionTreeData = { rootId: 'q1', nodes: {} }
    const state = useDecisionTree(empty)
    expect(state.empty.value).toBe(true)
    expect(state.currentNode.value).toBeNull()
  })

  it('根节点 options=[] → empty=true', () => {
    const noOptions: DecisionTreeData = {
      rootId: 'q1',
      nodes: { q1: { id: 'q1', question: 'Q', options: [] } },
    }
    const state = useDecisionTree(noOptions)
    expect(state.empty.value).toBe(true)
  })

  it('根节点 options=[] 时 selectOption 返回 null', () => {
    const noOptions: DecisionTreeData = {
      rootId: 'q1',
      nodes: { q1: { id: 'q1', question: 'Q', options: [] } },
    }
    const state = useDecisionTree(noOptions)
    expect(state.selectOption({ id: 'x', label: 'X', nextId: null })).toBeNull()
  })
})

describe('useDecisionTree — progress（F13 clamp）', () => {
  it('根节点 progress.current = 1，total ≥ 1', () => {
    const state = useDecisionTree(fixture)
    expect(state.progress.value.current).toBe(1)
    expect(state.progress.value.total).toBeGreaterThanOrEqual(2)
  })

  it('前进一题后 progress.current = 2', () => {
    const state = useDecisionTree(fixture)
    state.selectOption(fixture.nodes.q1.options[0]) // → q2
    expect(state.progress.value.current).toBe(2)
  })

  it('total 被 clamp 在 [1, 20] 范围内（F13）', () => {
    // 构造深链 25 层，验证 total clamp 在 20
    const deep: DecisionTreeData = { rootId: 'n1', nodes: {} }
    for (let i = 1; i <= 25; i++) {
      deep.nodes[`n${i}`] = {
        id: `n${i}`,
        question: `Q${i}`,
        options: [{ id: `o${i}`, label: `O${i}`, nextId: i < 25 ? `n${i + 1}` : null }],
      }
    }
    const state = useDecisionTree(deep)
    expect(state.progress.value.total).toBe(20) // 被 clamp 到 20
  })
})

describe('useDecisionTree — estimateMaxDepth（环检测）', () => {
  it('分叉树取最大深度', () => {
    const state = useDecisionTree(fixture)
    // q1 → q2/q3（深 2）/ 叶子（深 1）；从 q1 出发最大深度 2
    expect(state.progress.value.total).toBe(2)
  })

  it('环数据不无限递归', () => {
    const cyclic: DecisionTreeData = {
      rootId: 'a',
      nodes: {
        a: { id: 'a', question: 'A', options: [{ id: 'toB', label: 'B', nextId: 'b' }] },
        b: { id: 'b', question: 'B', options: [{ id: 'toA', label: 'A', nextId: 'a' }] },
      },
    }
    const state = useDecisionTree(cyclic)
    expect(typeof state.progress.value.total).toBe('number')
    expect(state.progress.value.total).toBeGreaterThanOrEqual(1)
  })
})
