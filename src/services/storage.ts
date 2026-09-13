import type { PlanResult } from '../domain/types'

const STORAGE_KEY = 'nanxi-smart-travel:last-plan'

export function savePlan(plan: PlanResult, storage: Storage = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(plan))
}

export function loadSavedPlan(storage: Storage = localStorage): PlanResult | undefined {
  const serialized = storage.getItem(STORAGE_KEY)
  if (!serialized) return undefined
  try {
    const parsed = JSON.parse(serialized) as PlanResult
    return parsed?.id && Array.isArray(parsed.stops) ? parsed : undefined
  } catch {
    return undefined
  }
}
