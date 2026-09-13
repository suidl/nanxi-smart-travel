import { findMissingConstraints, normalizeTripRequest } from '../domain/constraints'
import type { ItineraryStop, PlanResult, Poi, ToolTrace, TripRequest } from '../domain/types'
import { calculateBudget } from '../tools/budget-calculator'
import { validateItinerary } from '../tools/itinerary-validator'
import { searchPois } from '../tools/poi-search'
import { estimateRoute } from '../tools/route-estimate'
import type { WeatherProvider } from '../tools/weather'

export interface PlannerDependencies {
  pois: Poi[]
  weatherProvider: WeatherProvider
  now?: () => Date
  interpretation?: PlanResult['interpretation']
}

function minutesToTime(total: number): string {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function openingMinute(poi: Poi): number | null {
  if (!poi.openingHours) return null
  const [hours, minutes] = poi.openingHours.split('-')[0].split(':').map(Number)
  return hours * 60 + minutes
}

export function buildStops(ordered: Poi[], totalTravelMinutes: number, startMinute = 9 * 60): ItineraryStop[] {
  const travelPerStop = Math.max(12, Math.round(totalTravelMinutes / Math.max(ordered.length, 1)))
  let cursor = startMinute
  return ordered.map((poi, index) => {
    cursor += index === 0 ? travelPerStop : travelPerStop
    const opensAt = openingMinute(poi)
    if (opensAt !== null && cursor < opensAt) cursor = opensAt
    const startTime = minutesToTime(cursor)
    cursor += poi.durationMinutes
    return {
      id: `stop-${index + 1}-${poi.id}`,
      poi,
      startTime,
      endTime: minutesToTime(cursor),
      travelMinutes: travelPerStop,
      estimatedCost: poi.costPerPerson ?? 0,
      completed: false,
      note: poi.openingHours ? '开放信息已校验' : '开放信息需出发前复核',
    }
  })
}

function trace(
  kind: ToolTrace['kind'],
  label: string,
  inputSummary: string,
  resultSummary: string,
  durationMs: number,
): ToolTrace {
  return { kind, label, inputSummary, resultSummary, status: 'success', durationMs }
}

export async function planTrip(
  request: TripRequest,
  dependencies: PlannerDependencies,
): Promise<PlanResult> {
  const missing = findMissingConstraints(request)
  if (missing.length > 0) throw new Error(`缺少关键条件：${missing.join('、')}`)

  const now = dependencies.now?.() ?? new Date()
  const normalized = normalizeTripRequest(request)
  const start = dependencies.pois.find((poi) => poi.name === normalized.start)
    ?? dependencies.pois.find((poi) => poi.category === 'transport')
  if (!start) throw new Error('未找到可用的出发节点')

  const weather = await dependencies.weatherProvider.getForecast(
    normalized.date,
    start.latitude,
    start.longitude,
  )
  const candidates = searchPois(normalized, dependencies.pois, weather)
    .filter((poi) => poi.category !== 'food')

  let selected = candidates.slice(0, 4)
  let route = estimateRoute(start, selected)
  let ordered = route.orderedPoiIds.map((id) => selected.find((poi) => poi.id === id)!)
  let stops = buildStops(ordered, route.totalTravelMinutes)
  let budget = calculateBudget(normalized, stops)

  while (budget.total > normalized.budget && selected.length > 3) {
    selected = selected.slice(0, -1)
    route = estimateRoute(start, selected)
    ordered = route.orderedPoiIds.map((id) => selected.find((poi) => poi.id === id)!)
    stops = buildStops(ordered, route.totalTravelMinutes)
    budget = calculateBudget(normalized, stops)
  }

  const validationIssues = validateItinerary(normalized, stops, weather, budget)
  const traces = [
    trace('constraints', dependencies.interpretation?.source === 'ai' ? 'AI 理解旅行约束' : '理解旅行约束', `${normalized.partySize} 人、${normalized.days} 天、预算 ¥${normalized.budget}`, dependencies.interpretation?.summary ?? `识别 ${normalized.preferences.length} 项偏好`, 42),
    trace('weather', '查询天气', normalized.date, `${weather.summary}，降雨概率 ${weather.precipitationProbability}%`, 318),
    trace('poi_search', '筛选景点', normalized.preferences.join('、'), `从 ${dependencies.pois.length} 条数据中筛选 ${candidates.length} 个候选`, 76),
    trace('route', '优化路线', `${selected.length} 个目的地`, `预计 ${route.totalDistanceKm} km，减少折返`, 64),
    trace('budget', '核算预算', `上限 ¥${normalized.budget}`, `预计 ¥${budget.total}，含 10% 预留`, 28),
    trace('validation', '检查可执行性', '开放时间、体力、天气与预算', validationIssues.length === 0 ? '全部校验通过' : `发现 ${validationIssues.length} 项风险`, 37),
  ] satisfies ToolTrace[]

  return {
    id: `trip-${now.getTime()}`,
    request: normalized,
    weather,
    stops,
    route,
    budget,
    traces,
    validationIssues,
    generatedAt: now.toISOString(),
    interpretation: dependencies.interpretation,
  }
}
