import type { TripRequest, WalkingLevel } from './types'

const CHINESE_NUMERALS: Record<string, number> = {
  一: 1, 二: 2, 两: 2, 双: 2, 三: 3, 四: 4, 五: 5,
  六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
}

const PREFERENCE_ALIASES: Array<[RegExp, string]> = [
  [/古村|古镇|古街/, '古村'],
  [/小吃|麦饼|美食|餐饮|当地菜/, '美食'],
  [/山水|江景|溪流|瀑布/, '山水'],
  [/亲子|儿童|带娃/, '亲子'],
  [/文化|人文|非遗|历史/, '文化'],
]

function parseNumber(token: string): number | undefined {
  const arabic = /^(\d+)$/.exec(token.trim())
  if (arabic) return Number(arabic[1])
  if (token in CHINESE_NUMERALS) return CHINESE_NUMERALS[token]
  return undefined
}

/**
 * 从自然语言 prompt 中提取行程天数。
 * 支持："五日游"、"两天"、"3天"、"1日" 等写法。
 */
export function requestedDaysFromPrompt(prompt: string): number | undefined {
  const match = /([一二两双三四五六七八九十\d]+)\s*(?:日游|天游|天|日)/.exec(prompt)
  if (!match) return undefined
  return parseNumber(match[1])
}

/**
 * 从自然语言 prompt 中提取旅行偏好，与 plan-core 的别名规则保持一致。
 */
function requestedPreferencesFromPrompt(prompt: string): string[] {
  return PREFERENCE_ALIASES
    .filter(([pattern]) => pattern.test(prompt))
    .map(([, label]) => label)
}

/**
 * 从自然语言 prompt 中提取明确给出的总预算。
 * 支持："预算 6000"、"预算6000元"、"预算是 ¥6000" 等写法。
 */
function requestedBudgetFromPrompt(prompt: string): number | undefined {
  const match = /预算\s*[:：]?\s*(?:是|为|约|大概|大约)?\s*[¥￥]?\s*(\d+)/.exec(prompt)
  if (!match) return undefined
  const budget = Number(match[1])
  return budget > 0 ? budget : undefined
}

/**
 * 从自然语言 prompt 中识别步行强度。
 */
function requestedWalkingLevelFromPrompt(prompt: string): WalkingLevel | undefined {
  if (/少走路|不想走太多|不要爬山|轻松|休闲/.test(prompt)) return 'low'
  if (/徒步|登山|爬山|暴走/.test(prompt)) return 'high'
  return undefined
}

interface PeopleOverride {
  adults: number
  children: number
  seniors: number
}

/**
 * 从自然语言 prompt 中提取同行人员构成。
 * 支持："双人"、"三人"、"两大一小"、"两位老人" 等写法。
 * 命中时会明确重置未提及的人群为 0。
 */
function requestedPeopleFromPrompt(prompt: string): PeopleOverride | undefined {
  // "两位老人" / "X个老人" → 仅老人
  const seniorMatch = /([一二两双三四五六七八九十\d]+)\s*(?:位|个)?\s*老人/.exec(prompt)
  if (seniorMatch) {
    const seniors = parseNumber(seniorMatch[1])
    if (seniors !== undefined) return { adults: 0, children: 0, seniors }
  }

  // "两大一小" / "X大Y小" → 成人 + 儿童
  const adultChildMatch = /([一二两双三四五六七八九十\d]+)\s*(?:大|大人|成人)[\s,，、]*([一二两双三四五六七八九十\d]+)\s*(?:小|小孩|儿童)/.exec(prompt)
  if (adultChildMatch) {
    const adults = parseNumber(adultChildMatch[1])
    const children = parseNumber(adultChildMatch[2])
    if (adults !== undefined && children !== undefined) {
      return { adults, children, seniors: 0 }
    }
  }

  // "双人" / "三人" / "X人" / "X个人" → 均视为成人
  const groupMatch = /([一二两双三四五六七八九十\d]+)\s*(?:位|个)?\s*人/.exec(prompt)
  if (groupMatch) {
    const adults = parseNumber(groupMatch[1])
    if (adults !== undefined) return { adults, children: 0, seniors: 0 }
  }

  return undefined
}

/**
 * 基于已有 TripRequest 和一句自然语言 prompt，派生新的行程请求。
 * prompt 会作为 notes 透传给 AI 约束解析器；
 * 若 prompt 中明确提到天数 / 人数 / 预算 / 偏好 / 步行强度，则覆盖对应字段；
 * 未提及预算时按天比例重算预算。
 */
export function deriveRequestFromPrompt(base: TripRequest, prompt: string): TripRequest {
  const days = requestedDaysFromPrompt(prompt) ?? base.days
  const people = requestedPeopleFromPrompt(prompt)
  const promptPreferences = requestedPreferencesFromPrompt(prompt)
  const walkingLevel = requestedWalkingLevelFromPrompt(prompt) ?? base.walkingLevel
  const explicitBudget = requestedBudgetFromPrompt(prompt)
  const budgetPerDay = Math.max(200, Math.round(base.budget / Math.max(1, base.days)))

  const preferences = [...new Set([...base.preferences, ...promptPreferences])]

  return {
    ...base,
    days,
    adults: people?.adults ?? base.adults,
    children: people?.children ?? base.children,
    seniors: people?.seniors ?? base.seniors,
    budget: explicitBudget ?? days * budgetPerDay,
    preferences,
    walkingLevel,
    notes: prompt,
  }
}
