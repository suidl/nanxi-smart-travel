import { describe, expect, it } from 'vitest'
import { planTrip } from '../../src/agent/planner'
import { replanTrip } from '../../src/agent/replanner'
import { POIS } from '../../src/data/pois'
import type { TripRequest, WeatherSnapshot } from '../../src/domain/types'
import type { WeatherProvider } from '../../src/tools/weather'

const request: TripRequest = {
  start: '温州南站', date: '2026-09-19', days: 1,
  adults: 1, children: 1, seniors: 1, budget: 1200,
  preferences: ['山水', '古村'], walkingLevel: 'low', dietaryNeeds: '',
}

const fairWeather: WeatherSnapshot = {
  date: request.date, temperatureMin: 23, temperatureMax: 29,
  precipitationProbability: 20, summary: '晴到多云', source: 'demo',
  fetchedAt: '2026-09-12T10:00:00.000Z',
}

const rainWeather: WeatherSnapshot = {
  ...fairWeather, precipitationProbability: 90, summary: '午后阵雨',
}

describe('trip replanner', () => {
  it('preserves completed stops and replaces future outdoor stops after rain', async () => {
    const original = await planTrip(request, {
      pois: POIS,
      weatherProvider: { getForecast: async () => fairWeather },
      now: () => new Date('2026-09-12T10:00:00.000Z'),
    })
    const completedPoiId = original.stops[0].poi.id

    const replanned = await replanTrip(original, {
      type: 'rain', label: '午后阵雨', currentTime: original.stops[0].endTime, demo: true,
    }, {
      pois: POIS,
      weatherProvider: { getForecast: async () => rainWeather } as WeatherProvider,
      now: () => new Date('2026-09-12T14:00:00.000Z'),
    })

    expect(replanned.stops[0]).toMatchObject({ completed: true, poi: { id: completedPoiId } })
    expect(replanned.stops.filter((stop) => !stop.completed).every(
      (stop) => stop.poi.weatherSuitability !== 'outdoor',
    )).toBe(true)
    expect(replanned.changeSummary?.reason).toContain('阵雨')
    expect(replanned.validationIssues).toEqual([])
  })
})
