// Story 3-2: 部署方案详情类型
// 与 decision-tree.ts 的 DeploymentCategory / DeploymentDifficulty 对齐

import type { DeploymentCategory, DeploymentDifficulty } from './decision-tree'

export type PlanPriceRange = 'free' | 'low' | 'medium' | 'high'

export interface DeploymentPlan {
  planId: string
  planName: string
  category: DeploymentCategory
  difficulty: DeploymentDifficulty
  priceRange: PlanPriceRange
  /** 一句话介绍，≤ 60 字符 */
  summary: string
  /** 推荐理由，1-3 条 */
  reason: string[]
  /** 优点，≥ 2 条 */
  pros: string[]
  /** 缺点 / 限制，≥ 1 条 */
  cons: string[]
  /** 适合人群，≥ 1 条 */
  suitableFor: string[]
  /** 官方链接（可选），必须以 https:// 开头 */
  externalUrl?: string
}
