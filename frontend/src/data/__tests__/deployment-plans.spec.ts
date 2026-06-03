import { describe, it, expect } from 'vitest'
import { deploymentPlans } from '@/data/deployment-plans'

const VALID_CATEGORIES = ['static', 'spa', 'ssr', 'fullstack', 'container'] as const
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const
const VALID_PRICE_RANGES = ['free', 'low', 'medium', 'high'] as const

describe('deploymentPlans 完整性', () => {
  const plans = Object.values(deploymentPlans)

  it('注册表至少包含 10 个独立 planId', () => {
    expect(plans.length).toBeGreaterThanOrEqual(10)
  })

  it('所有 planId 全部为严格小写 kebab-case（禁止首尾连字符与连续连字符）', () => {
    // 严格 kebab-case：小写字母开头，允许 a-z0-9，连字符仅作分隔（不连续、不结尾）
    const strictKebabCase = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
    for (const plan of plans) {
      expect(plan.planId).toMatch(strictKebabCase)
    }
  })

  it('planId 与注册表 key 严格对齐', () => {
    for (const [key, plan] of Object.entries(deploymentPlans)) {
      expect(plan.planId).toBe(key)
    }
  })

  it('每个 plan 必填字段非空', () => {
    for (const plan of plans) {
      expect(plan.planId).toBeTruthy()
      expect(plan.planName).toBeTruthy()
      expect(plan.summary).toBeTruthy()
      expect(plan.reason.length).toBeGreaterThan(0)
      expect(plan.pros.length).toBeGreaterThan(0)
      expect(plan.cons.length).toBeGreaterThan(0)
      expect(plan.suitableFor.length).toBeGreaterThan(0)
    }
  })

  it('summary 长度 ≤ 60 字符', () => {
    for (const plan of plans) {
      expect(plan.summary.length).toBeLessThanOrEqual(60)
    }
  })

  it('reason.length ∈ [1, 3]', () => {
    for (const plan of plans) {
      expect(plan.reason.length).toBeGreaterThanOrEqual(1)
      expect(plan.reason.length).toBeLessThanOrEqual(3)
    }
  })

  it('pros.length ≥ 2', () => {
    for (const plan of plans) {
      expect(plan.pros.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('cons.length ≥ 1', () => {
    for (const plan of plans) {
      expect(plan.cons.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('suitableFor.length ≥ 1', () => {
    for (const plan of plans) {
      expect(plan.suitableFor.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('externalUrl（若存在）以 https:// 开头', () => {
    for (const plan of plans) {
      if (plan.externalUrl !== undefined) {
        expect(plan.externalUrl.startsWith('https://')).toBe(true)
      }
    }
  })

  it('category 在合法枚举集合内', () => {
    for (const plan of plans) {
      expect(VALID_CATEGORIES).toContain(plan.category)
    }
  })

  it('difficulty 在合法枚举集合内', () => {
    for (const plan of plans) {
      expect(VALID_DIFFICULTIES).toContain(plan.difficulty)
    }
  })

  it('priceRange 在合法枚举集合内', () => {
    for (const plan of plans) {
      expect(VALID_PRICE_RANGES).toContain(plan.priceRange)
    }
  })

  it('覆盖场景：≥3 免费静态托管', () => {
    const freeStatic = plans.filter(
      (p) => p.category === 'static' && p.priceRange === 'free',
    )
    expect(freeStatic.length).toBeGreaterThanOrEqual(3)
  })

  it('覆盖场景：≥1 Serverless / Functions 方案', () => {
    const serverless = plans.filter((p) => p.category === 'spa' || p.category === 'ssr')
    expect(serverless.length).toBeGreaterThanOrEqual(1)
  })

  it('覆盖场景：≥2 全栈 PaaS', () => {
    const paas = plans.filter((p) => p.category === 'fullstack')
    expect(paas.length).toBeGreaterThanOrEqual(2)
  })

  it('覆盖场景：≥2 VPS 自建方案', () => {
    const vps = plans.filter(
      (p) =>
        p.planName.includes('VPS') ||
        p.planId.startsWith('vps-'),
    )
    expect(vps.length).toBeGreaterThanOrEqual(2)
  })

  it('覆盖场景：≥1 容器化专用方案', () => {
    const container = plans.filter((p) => p.category === 'container')
    expect(container.length).toBeGreaterThanOrEqual(1)
  })
})
