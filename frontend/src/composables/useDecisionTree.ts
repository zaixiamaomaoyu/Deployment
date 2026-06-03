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

export function useDecisionTree(data: DecisionTreeData) {
  const currentNodeId = ref(data.rootId)
  const answers = ref<DecisionTreeAnswer[]>([])

  const currentNode = computed<DecisionTreeNode | null>(
    () => data.nodes[currentNodeId.value] ?? null,
  )

  const isRoot = computed(() => currentNodeId.value === data.rootId)
  const canGoBack = computed(() => answers.value.length > 0)
  const empty = computed(
    () => !currentNode.value || currentNode.value.options.length === 0,
  )

  const progress = computed(() => {
    const answered = answers.value.length + 1
    const remaining = estimateMaxDepth(data, currentNodeId.value, new Set<string>())
    const total = answers.value.length + remaining
    return { current: answered, total: Math.max(total, answered) }
  })

  function selectOption(option: DecisionTreeOption): SelectOutcome | null {
    const node = currentNode.value
    if (!node) return null

    answers.value.push({ nodeId: node.id, optionId: option.id })

    if (option.nextId === null && option.result) {
      return {
        type: 'complete',
        payload: {
          answers: [...answers.value],
          result: option.result,
        },
      }
    }

    if (option.nextId !== null && data.nodes[option.nextId]) {
      currentNodeId.value = option.nextId
      return { type: 'advance', nextNode: data.nodes[option.nextId] }
    }

    // 数据残缺：nextId 指向不存在的节点，回滚
    console.warn(`[DecisionTree] nextId "${option.nextId}" 不存在于 nodes`)
    answers.value.pop()
    return null
  }

  function goBack(): DecisionTreeNode | null {
    if (!canGoBack.value) return null
    const last = answers.value.pop()!
    currentNodeId.value = last.nodeId
    return currentNode.value
  }

  function reset(): void {
    answers.value = []
    currentNodeId.value = data.rootId
  }

  return {
    currentNodeId,
    answers,
    currentNode,
    isRoot,
    canGoBack,
    empty,
    progress,
    selectOption,
    goBack,
    reset,
  }
}
