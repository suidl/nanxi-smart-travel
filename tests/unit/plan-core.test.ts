import { describe, expect, it } from 'vitest'
import type { TripRequest } from '../../src/domain/types'
import { mergeModelInterpretation } from '../../netlify/functions/_shared/plan-core'

const input: TripRequest = {
  start: '温州南站', date: '2026-09-19', days: 1,
  adults: 1, children: 1, seniors: 1, budget: 1200,
  preferences: ['山水'], walkingLevel: 'low', dietaryNeeds: '',
  notes: '想吃本地小吃，不要太累',
}

describe('AI interpretation guardrails', () => {
  it('allows semantic refinements but preserves hard travel constraints', () => {
    const result = mergeModelInterpretation(input, {
      start: '杭州东站', date: '2027-01-01', days: 2,
      adults: 9, children: 0, seniors: 0, budget: 9999,
      preferences: ['山水', '美食'], walkingLevel: 'medium', dietaryNeeds: '少辣',
      summary: '轻松体验山水与本地小吃',
    })

    expect(result.request).toMatchObject({
      start: '温州南站', date: '2026-09-19', days: 1,
      adults: 1, children: 1, seniors: 1, budget: 1200,
      preferences: ['山水', '美食'], walkingLevel: 'medium', dietaryNeeds: '少辣',
    })
    expect(result.summary).toBe('轻松体验山水与本地小吃')
  })

  it('falls back to original semantic fields when model fields are invalid', () => {
    const result = mergeModelInterpretation(input, {
      preferences: [], walkingLevel: 'extreme', dietaryNeeds: 7, summary: '',
    })

    expect(result.request.preferences).toEqual(['山水'])
    expect(result.request.walkingLevel).toBe('low')
    expect(result.request.dietaryNeeds).toBe('')
    expect(result.summary).toContain('山水')
  })

  it('turns free-form model phrases into supported priorities instead of inert tags', () => {
    const result = mergeModelInterpretation({ ...input, preferences: ['山水', '古村'], notes: '多看古村少走路，永嘉小吃' }, {
      preferences: ['山水', '古村', '节奏轻松', '多看古村 少走路', '永嘉小吃'],
      walkingLevel: 'medium', dietaryNeeds: '希望午餐尝试永嘉小吃',
      summary: '多看古村，少走路，尝试本地小吃',
    })

    expect(result.request.preferences).toEqual(['古村', '美食', '山水'])
    expect(result.request.walkingLevel).toBe('low')
  })
})
