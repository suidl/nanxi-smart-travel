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

  it('replans only the selected day of a multi-day itinerary', async () => {
    const original = await planTrip({ ...request, days: 3, budget: 3600 }, {
      pois: POIS,
      weatherProvider: { getForecast: async (date) => ({ ...fairWeather, date }) },
    })
    const dayOneIds = original.stops.filter((stop) => stop.dayIndex === 1).map((stop) => stop.id)
    const dayThreeIds = original.stops.filter((stop) => stop.dayIndex === 3).map((stop) => stop.id)
    const dayTwoDate = original.stops.find((stop) => stop.dayIndex === 2)?.date
    const replanned = await replanTrip(original, {
      type: 'rain', label: '午后阵雨', dayIndex: 2,
      currentTime: original.stops.find((stop) => stop.dayIndex === 2)!.endTime, demo: true,
    }, { pois: POIS, weatherProvider: { getForecast: async (date) => ({ ...rainWeather, date }) } })

    expect(replanned.stops.filter((stop) => stop.dayIndex === 1).map((stop) => stop.id)).toEqual(dayOneIds)
    expect(replanned.stops.filter((stop) => stop.dayIndex === 3).map((stop) => stop.id)).toEqual(dayThreeIds)
    expect(replanned.stops.filter((stop) => stop.dayIndex === 2).every((stop) => stop.date === dayTwoDate)).toBe(true)
    expect(replanned.dailyWeather?.[1]).toMatchObject({ date: dayTwoDate, precipitationProbability: 90 })
  })

  it('removes a closed next stop and reduces the remaining schedule after fatigue', async () => {
    const original = await planTrip(request, { pois: POIS, weatherProvider: { getForecast: async () => fairWeather } })
    const firstEnd = original.stops[0].endTime
    const closedId = original.stops[1].poi.id
    const closure = await replanTrip(original, {
      type: 'closure', label: '景点临时关闭', currentTime: firstEnd, affectedPoiId: closedId, demo: true,
    }, { pois: POIS, weatherProvider: { getForecast: async () => fairWeather } })
    expect(closure.stops.some((stop) => stop.poi.id === closedId)).toBe(false)

    const fatigue = await replanTrip(original, {
      type: 'fatigue', label: '老人感到疲劳', currentTime: firstEnd, demo: true,
    }, { pois: POIS, weatherProvider: { getForecast: async () => fairWeather } })
    expect(fatigue.stops.filter((stop) => !stop.completed).length).toBeLessThan(original.stops.length - 1)
    expect(fatigue.stops.filter((stop) => !stop.completed).every((stop) => stop.poi.walkingLevel === 'low')).toBe(true)
  })
})
