// Story 3-1: 决策树组件类型定义
// 仅声明形状，数据填充由 Story 3-2 负责

export interface DecisionTreeResult {
  planId: string
  planName: string
}

export interface DecisionTreeOption {
  id: string
  label: string
  nextId: string | null
  result?: DecisionTreeResult
}

export interface DecisionTreeNode {
  id: string
  question: string
  options: DecisionTreeOption[]
}

export interface DecisionTreeData {
  rootId: string
  nodes: Record<string, DecisionTreeNode>
}

export interface DecisionTreeAnswer {
  nodeId: string
  optionId: string
}

export interface DecisionTreeCompletePayload {
  answers: DecisionTreeAnswer[]
  result: DecisionTreeResult
}
