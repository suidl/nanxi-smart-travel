import type { PlanResult, Poi, ReplanEvent } from '../domain/types'
import { buildStops, type PlannerDependencies } from './planner'
import { searchPois } from '../tools/poi-search'
import { estimateOrderedRoute, estimateRoute } from '../tools/route-estimate'
import { calculateBudget } from '../tools/budget-calculator'
import { validateItinerary } from '../tools/itinerary-validator'

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export async function replanTrip(
  plan: PlanResult,
  event: ReplanEvent,
  dependencies: PlannerDependencies,
): Promise<PlanResult> {
  const dayIndex = event.dayIndex ?? 1
  const dayStops = plan.stops.filter((stop) => (stop.dayIndex ?? 1) === dayIndex)
  const otherStops = plan.stops.filter((stop) => (stop.dayIndex ?? 1) !== dayIndex)
  const date = dayStops[0]?.date ?? plan.dailyWeather?.[dayIndex - 1]?.date ?? plan.request.date
  const weather = await dependencies.weatherProvider.getForecast(
    date,
    dayStops[0]?.poi.latitude ?? 28.3,
    dayStops[0]?.poi.longitude ?? 120.7,
  )
  const eventMinute = timeToMinutes(event.currentTime)
  const hasFinished = (stop: PlanResult['stops'][number]) => stop.completed || timeToMinutes(stop.endTime) <= eventMinute
  const completed = dayStops.filter(hasFinished).map((stop) => ({ ...stop, completed: true }))
  const originalFuture = dayStops.filter((stop) => !hasFinished(stop))
  const excludedIds = new Set([...otherStops, ...completed].map((stop) => stop.poi.id))
  const request = event.type === 'budget' && event.newBudget
    ? { ...plan.request, budget: event.newBudget }
    : event.type === 'fatigue'
      ? { ...plan.request, walkingLevel: 'low' as const }
      : plan.request

  let candidates = searchPois(request, dependencies.pois, weather)
    .filter((poi) => !excludedIds.has(poi.id) && poi.category !== 'transport')
  if (event.type === 'rain') {
    candidates = candidates.filter((poi) => poi.weatherSuitability !== 'outdoor')
  }
  if (event.type === 'closure' && event.affectedPoiId) {
    candidates = candidates.filter((poi) => poi.id !== event.affectedPoiId)
  }
  if (event.type === 'budget') {
    candidates.sort((a, b) => (a.costPerPerson ?? 0) - (b.costPerPerson ?? 0))
  }

  const selected: Poi[] = []
  const targetCount = event.type === 'fatigue' ? Math.max(1, Math.ceil(originalFuture.length / 2)) : originalFuture.length
  for (const poi of candidates) {
    if (!selected.some((item) => item.id === poi.id)) selected.push(poi)
    if (selected.length >= targetCount) break
  }

  const start = completed.at(-1)?.poi
    ?? plan.stops.filter((stop) => (stop.dayIndex ?? 1) < dayIndex).at(-1)?.poi
    ?? dependencies.pois.find((poi) => poi.name === plan.request.start)
    ?? dependencies.pois[0]
  const route = estimateRoute(start, selected)
  const ordered = route.orderedPoiIds.map((id) => selected.find((poi) => poi.id === id)!)
  const futureStops = buildStops(ordered, route.totalTravelMinutes, timeToMinutes(event.currentTime), dayIndex, date)
  const stops = [...otherStops, ...completed, ...futureStops].sort((a, b) => (a.dayIndex ?? 1) - (b.dayIndex ?? 1))
  const budget = calculateBudget(request, stops)
  const dailyWeather = plan.dailyWeather ? [...plan.dailyWeather] : [plan.weather]
  dailyWeather[dayIndex - 1] = weather
  const validationIssues = validateItinerary(request, stops, dailyWeather, budget)
  const tripStart = dependencies.pois.find((poi) => poi.name === plan.request.start) ?? dependencies.pois[0]
  const totalRoute = estimateOrderedRoute(tripStart, stops.map((stop) => stop.poi))
  const newIds = new Set(futureStops.map((stop) => stop.poi.id))
  const replacedPoiIds = originalFuture
    .filter((stop) => !newIds.has(stop.poi.id))
    .map((stop) => stop.poi.id)

  return {
    ...plan,
    request,
    weather: dailyWeather[0],
    dailyWeather,
    stops,
    route: totalRoute,
    budget,
    validationIssues,
    generatedAt: (dependencies.now?.() ?? new Date()).toISOString(),
    changeSummary: {
      reason: event.label,
      budgetDelta: budget.total - plan.budget.total,
      replacedPoiIds,
    },
  }
}
