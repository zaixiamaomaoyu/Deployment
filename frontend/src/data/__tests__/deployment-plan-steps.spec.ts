import { describe, it, expect } from 'vitest'
import { deploymentPlans } from '@/data/deployment-plans'
import { deploymentPlanSteps } from '@/data/deployment-plan-steps'

describe('deploymentPlanSteps 完整性', () => {
  const planIds = Object.keys(deploymentPlans)

  it('每个 deploymentPlans 中的 planId 在 deploymentPlanSteps 中都有对应条目', () => {
    for (const planId of planIds) {
      expect(deploymentPlanSteps[planId]).toBeDefined()
    }
  })

  it('deploymentPlanSteps 中没有 deploymentPlans 不存在的 planId', () => {
    for (const planId of Object.keys(deploymentPlanSteps)) {
      expect(deploymentPlans[planId]).toBeDefined()
    }
  })

  it('每个 planId 对应的步骤数组长度 ∈ [3, 8]', () => {
    for (const planId of planIds) {
      const steps = deploymentPlanSteps[planId]
      expect(steps.length).toBeGreaterThanOrEqual(3)
      expect(steps.length).toBeLessThanOrEqual(8)
    }
  })

  it('每个步骤的 title 和 description 非空且不只包含空白', () => {
    for (const planId of planIds) {
      for (const step of deploymentPlanSteps[planId]) {
        expect(step.title.trim().length).toBeGreaterThan(0)
        expect(step.description.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('每个步骤的 title ≤ 30 字符', () => {
    for (const planId of planIds) {
      for (const step of deploymentPlanSteps[planId]) {
        expect(step.title.length).toBeLessThanOrEqual(30)
      }
    }
  })

  it('每个步骤的 description ≤ 200 字符', () => {
    for (const planId of planIds) {
      for (const step of deploymentPlanSteps[planId]) {
        expect(step.description.length).toBeLessThanOrEqual(200)
      }
    }
  })

  it('estimatedMinutes（若存在）为大于 0 的整数', () => {
    for (const planId of planIds) {
      for (const step of deploymentPlanSteps[planId]) {
        if (step.estimatedMinutes !== undefined) {
          expect(Number.isInteger(step.estimatedMinutes)).toBe(true)
          expect(step.estimatedMinutes).toBeGreaterThan(0)
        }
      }
    }
  })

  it('command（若存在）非空且不只包含空白', () => {
    for (const planId of planIds) {
      for (const step of deploymentPlanSteps[planId]) {
        if (step.command !== undefined) {
          expect(step.command.trim().length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('总步骤数 ≥ 12', () => {
    const totalSteps = planIds.reduce(
      (sum, planId) => sum + deploymentPlanSteps[planId].length,
      0,
    )
    expect(totalSteps).toBeGreaterThanOrEqual(12)
  })
})
