import { describe, expect, it } from 'vitest'
import { planTrip } from '../../src/agent/planner'
import { POIS } from '../../src/data/pois'
import type { TripRequest, WeatherSnapshot } from '../../src/domain/types'
import type { WeatherProvider } from '../../src/tools/weather'
import { mergeModelInterpretation } from '../../netlify/functions/_shared/plan-core'

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
      interpretation: { source: 'ai', model: 'deepseek-flash', summary: '适合家庭的轻松山水古村路线' },
    })

    expect(plan.stops.length).toBeGreaterThanOrEqual(4)
    expect(plan.stops.length).toBeLessThanOrEqual(6)
    expect(plan.stops[0].poi.category).toBe('transport')
    expect(plan.stops.every((stop) => stop.poi.sourceUrl.startsWith('https://'))).toBe(true)
    expect(plan.budget.total).toBeLessThanOrEqual(1200)
    expect(plan.traces.map((trace) => trace.kind)).toEqual([
      'constraints', 'weather', 'poi_search', 'route', 'budget', 'validation',
    ])
    expect(plan.validationIssues).toEqual([])
    expect(plan.interpretation).toEqual({ source: 'ai', model: 'deepseek-flash', summary: '适合家庭的轻松山水古村路线' })
    expect(plan.traces[0].resultSummary).toContain('适合家庭的轻松山水古村路线')
  })

  it('changes the selected places and includes a food experience when the user prioritizes villages and snacks', async () => {
    const before = await planTrip(request, { pois: POIS, weatherProvider })
    const interpreted = mergeModelInterpretation({ ...request, notes: '多看古村少走路，永嘉小吃' }, {
      preferences: ['山水', '古村', '多看古村 少走路', '永嘉小吃'],
      walkingLevel: 'low', dietaryNeeds: '希望午餐尝试永嘉小吃', summary: '多看古村和小吃',
    })
    const after = await planTrip(interpreted.request, { pois: POIS, weatherProvider })

    expect(after.stops.map((stop) => stop.poi.id)).not.toEqual(before.stops.map((stop) => stop.poi.id))
    expect(after.stops.filter((stop) => stop.poi.tags.includes('古村')).length).toBeGreaterThanOrEqual(2)
    expect(after.stops.some((stop) => stop.poi.category === 'food')).toBe(true)
  })

  it('creates distinct dated daily schedules and weather for a five-day trip', async () => {
    const dates: string[] = []
    const plan = await planTrip({ ...request, days: 5, budget: 6000 }, {
      pois: POIS,
      weatherProvider: { getForecast: async (date) => { dates.push(date); return { ...snapshot, date } } },
    })

    expect(dates).toEqual(['2026-09-19', '2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23'])
    expect([...new Set(plan.stops.map((stop) => stop.date))]).toEqual(dates)
    expect(plan.stops.filter((stop) => stop.dayIndex === 5).length).toBeGreaterThan(0)
    for (let d = 1; d <= 5; d += 1) {
      const dayStops = plan.stops.filter((stop) => stop.dayIndex === d && stop.poi.category !== 'transport')
      expect(new Set(dayStops.map((stop) => stop.poi.id)).size).toBe(dayStops.length)
    }
    expect(plan.dailyWeather?.map((item) => item.date)).toEqual(dates)
  })
})
