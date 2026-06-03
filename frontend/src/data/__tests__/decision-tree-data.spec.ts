import { describe, it, expect } from 'vitest'
import { decisionTreeData } from '@/data/decision-tree-data'
import { deploymentPlans } from '@/data/deployment-plans'

// 工具：计算从某节点出发到叶子的深度（含当前节点，叶子不计入）
function depthOf(nodeId: string, visited: Set<string>): number {
  if (visited.has(nodeId)) return 0
  visited.add(nodeId)
  const node = decisionTreeData.nodes[nodeId]
  if (!node || node.options.length === 0) return 0
  const childDepths = node.options
    .filter((o) => o.nextId !== null)
    .map((o) => depthOf(o.nextId!, new Set(visited)))
  if (childDepths.length === 0) return 1
  return 1 + Math.max(...childDepths)
}

// 工具：收集从某节点出发所有可达叶子的深度（含当前节点）
function collectLeafDepths(nodeId: string, depth: number, visited: Set<string>, out: number[]): void {
  if (visited.has(nodeId)) return
  visited.add(nodeId)
  const node = decisionTreeData.nodes[nodeId]
  if (!node) return
  for (const opt of node.options) {
    if (opt.nextId === null) {
      out.push(depth + 1)
    } else {
      collectLeafDepths(opt.nextId, depth + 1, new Set(visited), out)
    }
  }
}

describe('decisionTreeData 完整性', () => {
  it('根节点存在且 options 非空', () => {
    const root = decisionTreeData.nodes[decisionTreeData.rootId]
    expect(root).toBeDefined()
    expect(root.options.length).toBeGreaterThanOrEqual(2)
  })

  it('所有 nextId 指向已定义节点或为 null', () => {
    for (const node of Object.values(decisionTreeData.nodes)) {
      for (const opt of node.options) {
        if (opt.nextId !== null) {
          expect(decisionTreeData.nodes[opt.nextId]).toBeDefined()
        }
      }
    }
  })

  it('叶子节点的 result.planId 全部在 deploymentPlans 中存在', () => {
    for (const node of Object.values(decisionTreeData.nodes)) {
      for (const opt of node.options) {
        if (opt.nextId === null) {
          expect(opt.result).toBeDefined()
          expect(deploymentPlans[opt.result!.planId]).toBeDefined()
        }
      }
    }
  })

  it('树中无环（DFS 检测）', () => {
    const visited = new Set<string>()
    const dfs = (id: string, path: string[]) => {
      if (path.includes(id)) {
        throw new Error(`检测到环：${[...path, id].join(' → ')}`)
      }
      if (visited.has(id)) return
      visited.add(id)
      const node = decisionTreeData.nodes[id]
      if (!node) return
      for (const opt of node.options) {
        if (opt.nextId !== null) dfs(opt.nextId, [...path, id])
      }
    }
    dfs(decisionTreeData.rootId, [])
  })

  it('树的深度 ∈ [3, 6]', () => {
    const depth = depthOf(decisionTreeData.rootId, new Set())
    expect(depth).toBeGreaterThanOrEqual(3)
    expect(depth).toBeLessThanOrEqual(6)
  })

  it('每个非叶子节点 options 数量 ∈ [2, 5]', () => {
    for (const node of Object.values(decisionTreeData.nodes)) {
      // AC #3: 所有节点 options 数量都应在 [2, 5]
      expect(node.options.length).toBeGreaterThanOrEqual(2)
      expect(node.options.length).toBeLessThanOrEqual(5)
    }
  })

  it('节点 id 全局唯一', () => {
    const ids = Object.keys(decisionTreeData.nodes)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('option.id 在全局唯一（跨节点也不重复）', () => {
    const allOptionIds: string[] = []
    for (const node of Object.values(decisionTreeData.nodes)) {
      for (const opt of node.options) {
        allOptionIds.push(opt.id)
      }
    }
    expect(new Set(allOptionIds).size).toBe(allOptionIds.length)
  })

  it('叶子 result.planName 与 deploymentPlans[planId].planName 严格相等（跨表一致性）', () => {
    for (const node of Object.values(decisionTreeData.nodes)) {
      for (const opt of node.options) {
        if (opt.nextId === null && opt.result) {
          const plan = deploymentPlans[opt.result.planId]
          expect(plan).toBeDefined()
          expect(opt.result.planName).toBe(plan.planName)
        }
      }
    }
  })

  it('从根出发所有可达叶子深度差异 ≤ 3', () => {
    const leafDepths: number[] = []
    collectLeafDepths(decisionTreeData.rootId, 0, new Set(), leafDepths)
    expect(leafDepths.length).toBeGreaterThan(0)
    const min = Math.min(...leafDepths)
    const max = Math.max(...leafDepths)
    expect(max - min).toBeLessThanOrEqual(3)
  })

  it('每条根→叶子路径可在 ≤ 6 步内到达', () => {
    const leafDepths: number[] = []
    collectLeafDepths(decisionTreeData.rootId, 0, new Set(), leafDepths)
    for (const d of leafDepths) {
      expect(d).toBeLessThanOrEqual(6)
    }
  })
})
