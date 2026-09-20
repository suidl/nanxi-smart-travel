import { describe, expect, it } from 'vitest'
import { deriveRequestFromPrompt, requestedDaysFromPrompt } from '../../src/domain/prompt-constraints'
import type { TripRequest } from '../../src/domain/types'

const BASE: TripRequest = {
  start: '温州南站',
  date: '2026-09-21',
  days: 2,
  adults: 2,
  children: 0,
  seniors: 2,
  budget: 2000,
  preferences: ['山水', '古村'],
  walkingLevel: 'low',
  dietaryNeeds: '',
  notes: '希望节奏轻松，午餐尝试永嘉小吃',
}

describe('prompt constraints', () => {
  it('uses the explicitly stated budget instead of scaling the previous per-day budget', () => {
    const result = deriveRequestFromPrompt(BASE, '楠溪江双人五日游，预算 6000')

    expect(result).toMatchObject({
      days: 5,
      adults: 2,
      children: 0,
      seniors: 0,
      budget: 6000,
    })
  })

  it('keeps the per-day scaling when the prompt does not mention a budget', () => {
    const result = deriveRequestFromPrompt({ ...BASE, days: 1, budget: 1200 }, '给我规划一个楠溪江双人五日游')

    expect(result).toMatchObject({ days: 5, adults: 2, budget: 6000 })
  })

  it('parses common budget phrasings', () => {
    expect(deriveRequestFromPrompt(BASE, '预算3000元的三日行程').budget).toBe(3000)
    expect(deriveRequestFromPrompt(BASE, '总预算约 ¥4500').budget).toBe(4500)
  })

  it('recognizes people counts written with 个 or 位', () => {
    expect(deriveRequestFromPrompt(BASE, '两个人去楠溪江')).toMatchObject({ adults: 2, children: 0, seniors: 0 })
    expect(deriveRequestFromPrompt(BASE, '3个人，安排轻松点')).toMatchObject({ adults: 3, children: 0, seniors: 0 })
  })

  it('keeps the previous party when the prompt only changes days', () => {
    const result = deriveRequestFromPrompt(BASE, '改成三日游')

    expect(result).toMatchObject({ days: 3, adults: 2, children: 0, seniors: 2 })
  })

  it('extracts days from common phrasings', () => {
    expect(requestedDaysFromPrompt('楠溪江五日游')).toBe(5)
    expect(requestedDaysFromPrompt('安排 3 天')).toBe(3)
    expect(requestedDaysFromPrompt('随便走走')).toBeUndefined()
  })
})
