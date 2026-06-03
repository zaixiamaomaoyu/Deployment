import { describe, it, expect } from 'vitest'
import { useDecisionTree } from '../useDecisionTree'
import { decisionTreeData } from '@/data/decision-tree-data'
import { deploymentPlans } from '@/data/deployment-plans'
import type { SelectOutcome } from '../useDecisionTree'

interface LeafResult {
  planId: string
  pathDepth: number
  optionIds: string[]
}

// DFS 走通每一条根→叶子路径
function walkAllPaths(onLeaf: (result: LeafResult) => void): void {
  function walkFromCurrent(state: ReturnType<typeof useDecisionTree>): void {
    const node = state.currentNode.value
    if (!node) return
    for (const opt of node.options) {
      const outcome: SelectOutcome | null = state.selectOption(opt)
      if (outcome?.type === 'complete') {
        onLeaf({
          planId: outcome.payload.result.planId,
          pathDepth: outcome.payload.answers.length,
          optionIds: outcome.payload.answers.map((a) => a.optionId),
        })
        state.goBack()
      } else if (outcome?.type === 'advance') {
        walkFromCurrent(state)
        state.goBack()
      }
    }
  }
  walkFromCurrent(useDecisionTree(decisionTreeData))
}

describe('useDecisionTree × decisionTreeData 集成', () => {
  it('所有叶子路径返回的 planId 都在 deploymentPlans 中存在（覆盖全部 12 条路径）', () => {
    const leaves: LeafResult[] = []
    walkAllPaths((r) => leaves.push(r))
    // 当前决策树：q2(4) + q3-beginner(1) + q5(2) + q6(2) + q4(3) = 12 条根→叶子路径
    expect(leaves.length).toBe(12)
    for (const leaf of leaves) {
      expect(deploymentPlans[leaf.planId]).toBeDefined()
    }
  })

  it('每条路径返回的 answers 长度等于路径深度', () => {
    const leaves: LeafResult[] = []
    walkAllPaths((r) => leaves.push(r))
    for (const leaf of leaves) {
      expect(leaf.pathDepth).toBe(leaf.optionIds.length)
    }
  })

  it('每条路径的深度 ≥ 2 且 ≤ 6', () => {
    const leaves: LeafResult[] = []
    walkAllPaths((r) => leaves.push(r))
    for (const leaf of leaves) {
      expect(leaf.pathDepth).toBeGreaterThanOrEqual(2)
      expect(leaf.pathDepth).toBeLessThanOrEqual(6)
    }
  })

  it('所有 planId 在 deploymentPlans 中独立（每条叶子路径对应一个有效推荐）', () => {
    const leaves: LeafResult[] = []
    walkAllPaths((r) => leaves.push(r))
    const planIds = new Set(leaves.map((l) => l.planId))
    for (const id of planIds) {
      const plan = deploymentPlans[id]
      expect(plan).toBeDefined()
      expect(plan.planId).toBe(id)
    }
  })

  it('覆盖决策树全部四个分支（static / fullstack / container）', () => {
    const leaves: LeafResult[] = []
    walkAllPaths((r) => leaves.push(r))
    const categories = new Set(
      leaves.map((l) => deploymentPlans[l.planId].category),
    )
    // 至少覆盖 static、fullstack、container 三个分支
    expect(categories.has('static')).toBe(true)
    expect(categories.has('fullstack')).toBe(true)
    expect(categories.has('container')).toBe(true)
  })
})
