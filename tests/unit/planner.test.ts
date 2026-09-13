import { describe, expect, it } from 'vitest'
import { planTrip } from '../../src/agent/planner'
import { POIS } from '../../src/data/pois'
import type { TripRequest, WeatherSnapshot } from '../../src/domain/types'
import type { WeatherProvider } from '../../src/tools/weather'

const request: TripRequest = {
  start: '温州南站',
  date: '2026-09-19',
  days: 1,
  adults: 1,
  children: 1,
  seniors: 1,
  budget: 1200,
  preferences: ['山水', '古村'],
  walkingLevel: 'low',
  dietaryNeeds: '',
}

const snapshot: WeatherSnapshot = {
  date: '2026-09-19',
  temperatureMin: 23,
  temperatureMax: 29,
  precipitationProbability: 35,
  summary: '多云，午后可能有阵雨',
  source: 'demo',
  fetchedAt: '2026-09-12T10:00:00.000Z',
}

const weatherProvider: WeatherProvider = {
  getForecast: async () => snapshot,
}

describe('trip planner', () => {
  it('produces an affordable, sourced itinerary with the complete tool trace', async () => {
    const plan = await planTrip(request, {
      pois: POIS,
      weatherProvider,
      now: () => new Date('2026-09-12T10:00:00.000Z'),
      interpretation: { source: 'ai', model: 'gpt-5.4-mini', summary: '适合家庭的轻松山水古村路线' },
    })

    expect(plan.stops.length).toBeGreaterThanOrEqual(3)
    expect(plan.stops.length).toBeLessThanOrEqual(5)
    expect(plan.stops.every((stop) => stop.poi.sourceUrl.startsWith('https://'))).toBe(true)
    expect(plan.budget.total).toBeLessThanOrEqual(1200)
    expect(plan.traces.map((trace) => trace.kind)).toEqual([
      'constraints', 'weather', 'poi_search', 'route', 'budget', 'validation',
    ])
    expect(plan.validationIssues).toEqual([])
    expect(plan.interpretation).toEqual({ source: 'ai', model: 'gpt-5.4-mini', summary: '适合家庭的轻松山水古村路线' })
    expect(plan.traces[0].resultSummary).toContain('适合家庭的轻松山水古村路线')
  })
})
