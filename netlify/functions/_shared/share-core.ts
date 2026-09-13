import type { PlanResult } from '../../../src/domain/types'

export function sanitizePlanForSharing(plan: PlanResult): PlanResult {
  const { notes: _notes, ...requestWithoutNotes } = plan.request
  return {
    ...plan,
    request: {
      ...requestWithoutNotes,
      dietaryNeeds: [],
    },
  }
}
