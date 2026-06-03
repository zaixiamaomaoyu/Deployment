// Story 3-1: 决策树组件类型定义
// Story 3-2: 向后兼容地扩展 DecisionTreeResult（新增字段一律可选）

export type DeploymentCategory = 'static' | 'spa' | 'ssr' | 'fullstack' | 'container'
export type DeploymentDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface DecisionTreeResult {
  planId: string
  planName: string
  // Story 3-2 新增（可选，向后兼容 Story 3-1 fixture）
  // 注意：数据中默认不填充，请从 deploymentPlans[planId] 读取，避免数据漂移
  reason?: string[]
  category?: DeploymentCategory
  difficulty?: DeploymentDifficulty
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
