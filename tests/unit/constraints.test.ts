import { describe, expect, it } from 'vitest'
import { findMissingConstraints, normalizeTripRequest } from '../../src/domain/constraints'

describe('trip request constraints', () => {
  it('normalizes the fixed judge scenario into a four-person low-walking trip', () => {
    const result = normalizeTripRequest({
      start: ' 温州南站 ',
      date: '2026-09-19',
      days: 1,
      adults: 2,
      children: 1,
      seniors: 1,
      budget: 1200,
      preferences: ['山水', '古村', '山水'],
      walkingLevel: 'low',
      dietaryNeeds: '',
    })

    expect(result).toMatchObject({
      start: '温州南站',
      budget: 1200,
      partySize: 4,
      walkingLevel: 'low',
      preferences: ['山水', '古村'],
      dietaryNeeds: [],
    })
  })

  it('reports the fields that prevent a useful plan', () => {
    expect(findMissingConstraints({
      start: '',
      date: '',
      days: 1,
      adults: 0,
      children: 0,
      seniors: 0,
      budget: 0,
      preferences: [],
      walkingLevel: 'medium',
      dietaryNeeds: '',
    })).toEqual(['出发地', '出行日期', '同行人数', '预算', '旅行偏好'])
  })
})
