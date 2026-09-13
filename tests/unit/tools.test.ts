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
})
