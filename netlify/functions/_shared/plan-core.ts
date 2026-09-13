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
const PREFERENCE_ALIASES: Array<[RegExp, string]> = [
  [/古村|古镇|古街/, '古村'],
  [/小吃|麦饼|美食|餐饮|当地菜/, '美食'],
  [/山水|江景|溪流|瀑布/, '山水'],
  [/亲子|儿童|带娃/, '亲子'],
  [/文化|人文|非遗|历史/, '文化'],
]

function canonicalPreference(value: string): string | undefined {
  return PREFERENCE_ALIASES.find(([pattern]) => pattern.test(value))?.[1]
}

export function mergeModelInterpretation(input: TripRequest, model: ModelInterpretation) {
  const modelPreferences = Array.isArray(model.preferences)
    && model.preferences.length > 0
    && model.preferences.every((item) => typeof item === 'string')
    ? model.preferences as string[]
    : input.preferences
  const recognized = modelPreferences.map(canonicalPreference).filter((item): item is string => Boolean(item))
  const note = input.notes ?? ''
  const hasPriority = /多看|优先|重点|主要|更想/.test(note)
  const notePreferences = hasPriority
    ? PREFERENCE_ALIASES.flatMap(([pattern, label]) => {
      const match = pattern.exec(note)
      return match ? [{ label, index: match.index }] : []
    }).sort((a, b) => a.index - b.index).map((item) => item.label)
    : []
  const preferences = [...new Set([...notePreferences, ...recognized, ...input.preferences.map(canonicalPreference).filter((item): item is string => Boolean(item))])]
  const modelWalkingLevel = typeof model.walkingLevel === 'string'
    && WALKING_LEVELS.includes(model.walkingLevel as WalkingLevel)
    ? model.walkingLevel as WalkingLevel
    : input.walkingLevel
  const walkingLevel = /少走路|不想走太多|不要爬山/.test(note) ? 'low' : modelWalkingLevel
  const dietaryNeeds = typeof model.dietaryNeeds === 'string' ? model.dietaryNeeds : input.dietaryNeeds
  const summary = typeof model.summary === 'string' && model.summary.trim()
    ? model.summary.trim()
    : `偏好${preferences.join('、')}，步行强度${walkingLevel === 'low' ? '低' : walkingLevel === 'medium' ? '中' : '高'}`

  return {
    request: { ...input, preferences, walkingLevel, dietaryNeeds },
    summary,
  }
}
