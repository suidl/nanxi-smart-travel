import { describe, expect, it } from 'vitest'
import { POIS } from '../../src/data/pois'
import { normalizeTripRequest } from '../../src/domain/constraints'
import type { ItineraryStop, TripRequest, WeatherSnapshot } from '../../src/domain/types'
import { calculateBudget } from '../../src/tools/budget-calculator'
import { searchPois } from '../../src/tools/poi-search'
import { estimateRoute } from '../../src/tools/route-estimate'
import { validateItinerary } from '../../src/tools/itinerary-validator'

const request: TripRequest = {
  start: '温州南站',
  date: '2026-09-19',
  days: 1,
  adults: 2,
  children: 1,
  seniors: 1,
  budget: 1200,
  preferences: ['山水', '古村'],
  walkingLevel: 'low',
  dietaryNeeds: '',
}

const weather: WeatherSnapshot = {
  date: '2026-09-19',
  temperatureMin: 23,
  temperatureMax: 29,
  precipitationProbability: 70,
  summary: '午后阵雨',
  source: 'demo',
  fetchedAt: '2026-09-12T10:00:00.000Z',
}

describe('travel planning tools', () => {
  it('keeps low-walking family-friendly places and favors all-weather places in rain', () => {
    const result = searchPois(normalizeTripRequest(request), POIS, weather)

    expect(result.length).toBeGreaterThanOrEqual(4)
    expect(result.every((poi) => poi.walkingLevel === 'low')).toBe(true)
    expect(result.slice(0, 3).some((poi) => poi.weatherSuitability !== 'outdoor')).toBe(true)
  })

  it('orders route from the start and labels travel values as estimates', () => {
    const selected = POIS.filter((poi) => ['shiwaiyan', 'furong', 'lishui'].includes(poi.id))
    const route = estimateRoute(POIS.find((poi) => poi.id === 'wenzhou-south')!, selected)

    expect(route.orderedPoiIds).toHaveLength(3)
    expect(route.totalDistanceKm).toBeGreaterThan(0)
    expect(route.totalTravelMinutes).toBeGreaterThan(0)
    expect(route.isEstimate).toBe(true)
  })

  it('keeps the judge scenario budget below 1200 yuan', () => {
    const pois = POIS.filter((poi) => ['shiwaiyan', 'furong', 'lishui'].includes(poi.id))
    const stops: ItineraryStop[] = pois.map((poi, index) => ({
      id: `stop-${index}`,
      poi,
      startTime: `${9 + index * 3}:00`,
      endTime: `${11 + index * 3}:00`,
      travelMinutes: index === 0 ? 80 : 25,
      estimatedCost: 0,
      completed: false,
      note: '',
    }))

    const budget = calculateBudget(normalizeTripRequest(request), stops)

    expect(budget.total).toBeLessThanOrEqual(1200)
    expect(budget.contingency).toBeGreaterThan(0)
  })

  it('keeps a meal allowance for days without an explicit food stop', () => {
    const foodPoi = POIS.find((poi) => poi.id === 'wheat-cake')!
    const stops: ItineraryStop[] = [{
      id: 'meal-day-1', dayIndex: 1, date: '2026-09-19', poi: foodPoi,
      startTime: '12:00', endTime: '12:45', travelMinutes: 20,
      estimatedCost: 20, completed: false, note: '',
    }]
    const budget = calculateBudget(normalizeTripRequest({ ...request, days: 2 }), stops)

    expect(budget.food).toBe(400)
  })

  it('counts a food stop once in the meal allowance instead of double-charging tickets', () => {
    const foodPoi = POIS.find((poi) => poi.id === 'wheat-cake')!
    const scenicPoi = POIS.find((poi) => poi.id === 'lishui')!
    const stops: ItineraryStop[] = [foodPoi, scenicPoi].map((poi, index) => ({
      id: `stop-${index}`, dayIndex: 1, date: '2026-09-19', poi,
      startTime: '12:00', endTime: '13:00', travelMinutes: 20,
      estimatedCost: poi.costPerPerson ?? 0, completed: false, note: '',
    }))
    const budget = calculateBudget(normalizeTripRequest({ ...request, days: 1 }), stops)

    // 门票只算丽水古街 15 元/人 × 4 人；麦饼 20 元/人 只计入餐饮额度，不重复计入门票。
    expect(budget.tickets).toBe(60)
    expect(budget.food).toBe(200)
  })

  it('reports opening-hour conflicts and walking-level mismatches', () => {
    const highWalkingPoi = POIS.find((poi) => poi.walkingLevel === 'high')!
    const stop: ItineraryStop = {
      id: 'risky-stop',
      poi: { ...highWalkingPoi, openingHours: '08:00-16:00' },
      startTime: '17:00',
      endTime: '18:00',
      travelMinutes: 20,
      estimatedCost: 0,
      completed: false,
      note: '',
    }

    const issues = validateItinerary(normalizeTripRequest(request), [stop], weather, {
      transport: 100,
      tickets: 0,
      food: 200,
      contingency: 30,
      total: 330,
    })

    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'OPENING_HOURS_CONFLICT',
      'WALKING_LEVEL',
    ]))
  })

  it('checks each dated stop against its own daily weather', () => {
    const outdoor = POIS.find((poi) => poi.id === 'taipingyan')!
    const stops: ItineraryStop[] = [1, 2].map((dayIndex) => ({
      id: `outdoor-${dayIndex}`, dayIndex, date: `2026-09-${18 + dayIndex}`,
      poi: outdoor, startTime: '10:00', endTime: '11:30', travelMinutes: 20,
      estimatedCost: 0, completed: false, note: '',
    }))
    const issues = validateItinerary(normalizeTripRequest({ ...request, days: 2 }), stops, [
      { ...weather, date: '2026-09-19', precipitationProbability: 10 },
      { ...weather, date: '2026-09-20', precipitationProbability: 90 },
    ], { transport: 100, tickets: 0, food: 400, contingency: 50, total: 550 })

    expect(issues.filter((issue) => issue.code === 'WEATHER_RISK').map((issue) => issue.poiId)).toEqual(['taipingyan'])
    expect(issues.filter((issue) => issue.code === 'WEATHER_RISK')).toHaveLength(1)
  })
})
