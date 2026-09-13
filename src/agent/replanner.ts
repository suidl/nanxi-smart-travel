import type { PlanResult, Poi, ReplanEvent } from '../domain/types'
import { buildStops, type PlannerDependencies } from './planner'
import { searchPois } from '../tools/poi-search'
import { estimateRoute } from '../tools/route-estimate'
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
  const weather = await dependencies.weatherProvider.getForecast(
    plan.request.date,
    plan.stops[0]?.poi.latitude ?? 28.3,
    plan.stops[0]?.poi.longitude ?? 120.7,
  )
  const eventMinute = timeToMinutes(event.currentTime)
  const hasFinished = (stop: PlanResult['stops'][number]) => stop.completed || timeToMinutes(stop.endTime) <= eventMinute
  const completed = plan.stops.filter(hasFinished).map((stop) => ({ ...stop, completed: true }))
  const originalFuture = plan.stops.filter((stop) => !hasFinished(stop))
  const excludedIds = new Set(completed.map((stop) => stop.poi.id))

  let candidates = searchPois(plan.request, dependencies.pois, weather)
    .filter((poi) => !excludedIds.has(poi.id) && poi.category !== 'transport')
  if (event.type === 'rain') {
    candidates = candidates.filter((poi) => poi.weatherSuitability !== 'outdoor')
  }
  if (event.type === 'closure' && event.affectedPoiId) {
    candidates = candidates.filter((poi) => poi.id !== event.affectedPoiId)
  }

  const selected: Poi[] = []
  for (const poi of candidates) {
    if (!selected.some((item) => item.id === poi.id)) selected.push(poi)
    if (selected.length >= originalFuture.length) break
  }

  const start = completed.at(-1)?.poi
    ?? dependencies.pois.find((poi) => poi.name === plan.request.start)
    ?? dependencies.pois[0]
  const route = estimateRoute(start, selected)
  const ordered = route.orderedPoiIds.map((id) => selected.find((poi) => poi.id === id)!)
  const futureStops = buildStops(ordered, route.totalTravelMinutes, timeToMinutes(event.currentTime))
  const stops = [...completed, ...futureStops]
  const request = event.type === 'budget' && event.newBudget
    ? { ...plan.request, budget: event.newBudget }
    : plan.request
  const budget = calculateBudget(request, stops)
  const validationIssues = validateItinerary(request, stops, weather, budget)
  const newIds = new Set(futureStops.map((stop) => stop.poi.id))
  const replacedPoiIds = originalFuture
    .filter((stop) => !newIds.has(stop.poi.id))
    .map((stop) => stop.poi.id)

  return {
    ...plan,
    request,
    weather,
    stops,
    route,
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
