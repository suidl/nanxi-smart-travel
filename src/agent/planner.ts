import { findMissingConstraints, normalizeTripRequest } from '../domain/constraints'
import type { ItineraryStop, PlanResult, Poi, ToolTrace, TripRequest } from '../domain/types'
import { calculateBudget } from '../tools/budget-calculator'
import { validateItinerary } from '../tools/itinerary-validator'
import { searchPois } from '../tools/poi-search'
import { estimateOrderedRoute, estimateRoute } from '../tools/route-estimate'
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

export function buildStops(ordered: Poi[], totalTravelMinutes: number, startMinute = 9 * 60, dayIndex = 1, date?: string, startPoi?: Poi): ItineraryStop[] {
  const travelPerStop = Math.max(12, Math.round(totalTravelMinutes / Math.max(ordered.length, 1)))
  let cursor = startMinute
  const stops: ItineraryStop[] = []

  if (startPoi) {
    stops.push({
      id: `stop-${dayIndex}-0-${startPoi.id}`,
      dayIndex,
      date,
      poi: startPoi,
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(cursor),
      travelMinutes: 0,
      estimatedCost: 0,
      completed: false,
      note: '出发集合点',
    })
  }

  ordered.forEach((poi, index) => {
    cursor += travelPerStop
    const opensAt = openingMinute(poi)
    if (opensAt !== null && cursor < opensAt) cursor = opensAt
    const startTime = minutesToTime(cursor)
    cursor += poi.durationMinutes
    stops.push({
      id: `stop-${dayIndex}-${index + 1}-${poi.id}`,
      dayIndex,
      date,
      poi,
      startTime,
      endTime: minutesToTime(cursor),
      travelMinutes: travelPerStop,
      estimatedCost: poi.costPerPerson ?? 0,
      completed: false,
      note: poi.openingHours ? '开放信息已校验' : '开放信息需出发前复核',
    })
  })
  return stops
}

function dateForDay(startDate: string, dayIndex: number): string {
  const date = new Date(`${startDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + dayIndex - 1)
  return date.toISOString().slice(0, 10)
}

function trace(
  kind: ToolTrace['kind'],
  label: string,
  inputSummary: string,
  resultSummary: string,
): ToolTrace {
  return { kind, label, inputSummary, resultSummary, status: 'success' }
}

export async function planTrip(
  request: TripRequest,
  dependencies: PlannerDependencies,
): Promise<PlanResult> {
  const missing = findMissingConstraints(request)
  if (missing.length > 0) throw new Error(`缺少关键条件：${missing.join('、')}`)

  const now = dependencies.now?.() ?? new Date()
  const normalized = normalizeTripRequest(request)
  const exactStart = dependencies.pois.find((poi) => poi.name === normalized.start)
  const start = exactStart
    ?? dependencies.pois.find((poi) => poi.name.includes(normalized.start) || normalized.start.includes(poi.name))
    ?? dependencies.pois.find((poi) => poi.category === 'transport')
  if (!start) throw new Error('未找到可用的出发节点')
  const startFallback = !exactStart && start.name !== normalized.start

  const usedIds = new Set<string>()
  const stops: ItineraryStop[] = []
  const dailyWeather: NonNullable<PlanResult['dailyWeather']> = []
  const dailyRoutes = [] as ReturnType<typeof estimateRoute>[]
  let dayStart = start

  for (let dayIndex = 1; dayIndex <= normalized.days; dayIndex += 1) {
    const date = dateForDay(normalized.date, dayIndex)
    const weather = await dependencies.weatherProvider.getForecast(date, dayStart.latitude, dayStart.longitude)
    dailyWeather.push(weather)
    const candidates = searchPois(normalized, dependencies.pois, weather, dayStart)
      .filter((poi) => poi.category !== 'transport' && !usedIds.has(poi.id))
    const nonFood = candidates.filter((poi) => poi.category !== 'food')
    const remainingDays = normalized.days - dayIndex + 1
    const reserveForLater = (remainingDays - 1) * 2
    const maxScenic = normalized.days === 1 && !normalized.preferences.includes('美食') ? 4 : 3
    const scenicCount = Math.min(maxScenic, Math.max(1, nonFood.length - reserveForLater))
    const selectedScenic = nonFood.slice(0, scenicCount)
    const scenicRoute = estimateRoute(dayStart, selectedScenic)
    const orderedScenic = scenicRoute.orderedPoiIds.map((id) => selectedScenic.find((poi) => poi.id === id)!)
    const food = normalized.preferences.includes('美食')
      ? candidates.find((poi) => poi.category === 'food')
      : undefined
    const ordered = food
      ? [...orderedScenic.slice(0, 1), food, ...orderedScenic.slice(1)]
      : orderedScenic
    if (ordered.length === 0) throw new Error('符合当前条件的点位不足以规划全部天数')
    ordered.forEach((poi) => usedIds.add(poi.id))
    const dailyRoute = estimateOrderedRoute(dayStart, ordered)
    dailyRoutes.push(dailyRoute)
    stops.push(...buildStops(ordered, dailyRoute.totalTravelMinutes, 9 * 60, dayIndex, date, dayStart))
    dayStart = ordered.at(-1)!
  }

  const weather = dailyWeather[0]
  const route = {
    orderedPoiIds: dailyRoutes.flatMap((item) => item.orderedPoiIds),
    totalDistanceKm: Number(dailyRoutes.reduce((sum, item) => sum + item.totalDistanceKm, 0).toFixed(1)),
    totalTravelMinutes: dailyRoutes.reduce((sum, item) => sum + item.totalTravelMinutes, 0),
    isEstimate: true as const,
  }
  const budget = calculateBudget(normalized, stops)

  const validationIssues = validateItinerary(normalized, stops, dailyWeather, budget)
  const traces = [
    trace('constraints', dependencies.interpretation?.source === 'ai' ? 'AI 理解旅行约束' : '理解旅行约束', `${normalized.partySize} 人、${normalized.days} 天、预算 ¥${normalized.budget}`, dependencies.interpretation?.summary ?? `识别 ${normalized.preferences.length} 项偏好`),
    trace('weather', '查询天气', `${normalized.date} 起 ${normalized.days} 天`, `已查询 ${dailyWeather.length} 天，首日${weather.summary}`),
    trace('poi_search', '筛选景点', normalized.preferences.join('、'), `从 ${dependencies.pois.length} 条数据中逐日筛选，安排 ${stops.length} 个节点`),
    trace('route', '优化路线', `${stops.length} 个目的地`, `逐日路线估算 ${route.totalDistanceKm} km`),
    trace('budget', '核算预算', `上限 ¥${normalized.budget}`, `预计 ¥${budget.total}，含 10% 预留`),
    trace('validation', '检查可执行性', '开放时间、体力、天气与预算', validationIssues.length === 0 ? '全部校验通过' : `发现 ${validationIssues.length} 项风险`),
  ] satisfies ToolTrace[]

  const baseInterpretation = dependencies.interpretation
  const interpretation = startFallback && baseInterpretation
    ? { ...baseInterpretation, summary: `${baseInterpretation.summary}（出发地"${normalized.start}"不在永嘉交通节点内，已以${start.name}为起点）` }
    : baseInterpretation

  return {
    id: `trip-${now.getTime()}`,
    request: normalized,
    weather,
    dailyWeather,
    stops,
    route,
    budget,
    traces,
    validationIssues,
    generatedAt: now.toISOString(),
    interpretation,
  }
}
