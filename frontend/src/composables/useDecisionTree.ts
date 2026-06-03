import { ref, computed } from 'vue'
import type {
  DecisionTreeAnswer,
  DecisionTreeCompletePayload,
  DecisionTreeData,
  DecisionTreeNode,
  DecisionTreeOption,
} from '@/types/decision-tree'

export type SelectOutcome =
  | { type: 'advance'; nextNode: DecisionTreeNode }
  | { type: 'complete'; payload: DecisionTreeCompletePayload }

/**
 * 估算从 nodeId 出发到任意叶子的最大步数（含当前节点）。
 * - 空节点或叶子返回 1
 * - 遇到环返回已探测深度，避免无限递归
 */
function estimateMaxDepth(data: DecisionTreeData, nodeId: string, visited: Set<string>): number {
  if (visited.has(nodeId)) return 1
  visited.add(nodeId)
  const node = data.nodes[nodeId]
  if (!node || node.options.length === 0) return 1
  const childDepths = node.options
    .filter((o) => o.nextId !== null)
    .map((o) => estimateMaxDepth(data, o.nextId as string, new Set(visited)))
  if (childDepths.length === 0) return 1
  return 1 + Math.max(...childDepths)
}

export function useDecisionTree(data: DecisionTreeData, initialNodeId?: string) {
  const startId = initialNodeId && data.nodes[initialNodeId] ? initialNodeId : data.rootId
  const currentNodeId = ref(startId)
  const answers = ref<DecisionTreeAnswer[]>([])
  const finished = ref(false)

  const currentNode = computed<DecisionTreeNode | null>(
    () => data.nodes[currentNodeId.value] ?? null,
  )

  const isRoot = computed(() => currentNodeId.value === data.rootId)
  const canGoBack = computed(() => answers.value.length > 0 && !finished.value)
  const empty = computed(
    () => !currentNode.value || currentNode.value.options.length === 0,
  )
  const isFinished = computed(() => finished.value)

  const progress = computed(() => {
    const answered = answers.value.length + 1
    const remaining = estimateMaxDepth(data, currentNodeId.value, new Set<string>())
    const total = answers.value.length + remaining
    // F13: clamp total 在 [1, 20]，避免 0 渲染异常或超大数字渲染爆炸
    const clampedTotal = Math.min(20, Math.max(1, Math.max(total, answered)))
    return { current: Math.min(answered, clampedTotal), total: clampedTotal }
  })

  function selectOption(option: DecisionTreeOption): SelectOutcome | null {
    const node = currentNode.value
    if (!node) return null

    answers.value.push({ nodeId: node.id, optionId: option.id })

    // 叶子且有 result → 完成
    if (option.nextId === null && option.result) {
      finished.value = true
      return {
        type: 'complete',
        payload: {
          answers: [...answers.value],
          result: option.result,
        },
      }
    }

    // 叶子但缺 result → 数据残缺（F3: 单独分支，准确 warn）
    if (option.nextId === null && !option.result) {
      console.warn(
        `[DecisionTree] option "${option.id}" 是叶子但缺少 result，无法生成推荐结果`,
      )
      answers.value.pop()
      return null
    }

    // 非叶子且 nextId 存在 → 推进
    if (option.nextId !== null && data.nodes[option.nextId]) {
      currentNodeId.value = option.nextId
      return { type: 'advance', nextNode: data.nodes[option.nextId] }
    }

    // 非叶子但 nextId 指向不存在节点 → 数据残缺（F3: 准确 warn）
    console.warn(`[DecisionTree] nextId "${option.nextId}" 不存在于 nodes`)
    answers.value.pop()
    return null
  }

  function goBack(): DecisionTreeNode | null {
    // F8: 显式 length 守卫，避免 pop()! 非空断言
    if (!answers.value.length) return null
    const last = answers.value.pop() as DecisionTreeAnswer
    finished.value = false
    currentNodeId.value = last.nodeId
    return currentNode.value
  }

  function reset(): void {
    answers.value = []
    finished.value = false
    currentNodeId.value = startId
  }

  return {
    currentNodeId,
    answers,
    currentNode,
    isRoot,
    canGoBack,
    empty,
    isFinished,
    progress,
    selectOption,
    goBack,
    reset,
  }
}
