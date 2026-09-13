import type { TripRequest, WalkingLevel } from '../../../src/domain/types'

export interface ModelInterpretation {
  start?: unknown
  date?: unknown
  days?: unknown
  adults?: unknown
  children?: unknown
  seniors?: unknown
  budget?: unknown
  preferences?: unknown
  walkingLevel?: unknown
  dietaryNeeds?: unknown
  summary?: unknown
}

const WALKING_LEVELS: WalkingLevel[] = ['low', 'medium', 'high']

export function mergeModelInterpretation(input: TripRequest, model: ModelInterpretation) {
  const preferences = Array.isArray(model.preferences)
    && model.preferences.length > 0
    && model.preferences.every((item) => typeof item === 'string')
    ? model.preferences as string[]
    : input.preferences
  const walkingLevel = typeof model.walkingLevel === 'string'
    && WALKING_LEVELS.includes(model.walkingLevel as WalkingLevel)
    ? model.walkingLevel as WalkingLevel
    : input.walkingLevel
  const dietaryNeeds = typeof model.dietaryNeeds === 'string' ? model.dietaryNeeds : input.dietaryNeeds
  const summary = typeof model.summary === 'string' && model.summary.trim()
    ? model.summary.trim()
    : `偏好${preferences.join('、')}，步行强度${walkingLevel === 'low' ? '低' : walkingLevel === 'medium' ? '中' : '高'}`

  return {
    request: { ...input, preferences, walkingLevel, dietaryNeeds },
    summary,
  }
}
