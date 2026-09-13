import { describe, expect, it } from 'vitest'
import type { PlanResult } from '../../src/domain/types'
import { loadSavedPlan, savePlan } from '../../src/services/storage'

describe('plan storage', () => {
  it('round-trips a saved plan through Web Storage', () => {
    const plan = { id: 'plan-1', generatedAt: '2026-09-12T10:00:00.000Z', stops: [] } as unknown as PlanResult

    savePlan(plan, localStorage)

    expect(loadSavedPlan(localStorage)).toMatchObject({ id: 'plan-1' })
  })

  it('returns undefined for corrupted saved data', () => {
    localStorage.setItem('nanxi-smart-travel:last-plan', '{bad json')

    expect(loadSavedPlan(localStorage)).toBeUndefined()
  })
})
