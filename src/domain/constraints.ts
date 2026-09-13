import type { NormalizedTripRequest, TripRequest } from './types'

export function normalizeTripRequest(input: TripRequest): NormalizedTripRequest {
  return {
    ...input,
    start: input.start.trim(),
    adults: Math.max(0, Math.floor(input.adults)),
    children: Math.max(0, Math.floor(input.children)),
    seniors: Math.max(0, Math.floor(input.seniors)),
    budget: Math.max(0, Math.round(input.budget)),
    preferences: [...new Set(input.preferences.map((item) => item.trim()).filter(Boolean))],
    partySize: Math.max(0, Math.floor(input.adults))
      + Math.max(0, Math.floor(input.children))
      + Math.max(0, Math.floor(input.seniors)),
    dietaryNeeds: input.dietaryNeeds
      .split(/[，,、]/)
      .map((item) => item.trim())
      .filter(Boolean),
  }
}

export function findMissingConstraints(input: TripRequest): string[] {
  const missing: string[] = []
  if (!input.start.trim()) missing.push('出发地')
  if (!input.date.trim()) missing.push('出行日期')
  if (input.adults + input.children + input.seniors <= 0) missing.push('同行人数')
  if (input.budget <= 0) missing.push('预算')
  if (input.preferences.length === 0) missing.push('旅行偏好')
  return missing
}
