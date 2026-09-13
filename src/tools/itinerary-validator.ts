import type { BudgetBreakdown, ItineraryStop, NormalizedTripRequest, ValidationIssue, WeatherSnapshot } from '../domain/types'

const walkingRank = { low: 0, medium: 1, high: 2 } as const

function isOutsideOpeningHours(stop: ItineraryStop): boolean {
  if (!stop.poi.openingHours) return false
  const [open, close] = stop.poi.openingHours.split('-')
  return stop.startTime < open || stop.startTime >= close
}

export function validateItinerary(
  request: NormalizedTripRequest,
  stops: ItineraryStop[],
  weather: WeatherSnapshot | WeatherSnapshot[],
  budget: BudgetBreakdown,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (budget.total > request.budget) {
    issues.push({ code: 'OVER_BUDGET', message: `预计总额 ¥${budget.total} 超过预算 ¥${request.budget}` })
  }
  for (const stop of stops) {
    const stopWeather = Array.isArray(weather)
      ? weather.find((snapshot) => snapshot.date === (stop.date ?? request.date)) ?? weather[0]
      : weather
    if (isOutsideOpeningHours(stop)) {
      issues.push({ code: 'OPENING_HOURS_CONFLICT', message: `${stop.poi.name} 的计划到达时间不在开放时段内`, poiId: stop.poi.id })
    }
    if (walkingRank[stop.poi.walkingLevel] > walkingRank[request.walkingLevel]) {
      issues.push({ code: 'WALKING_LEVEL', message: `${stop.poi.name} 的步行强度不符合要求`, poiId: stop.poi.id })
    }
    if (!stop.completed && stopWeather?.precipitationProbability >= 60 && stop.poi.weatherSuitability === 'outdoor') {
      issues.push({ code: 'WEATHER_RISK', message: `${stop.poi.name} 在当前天气下存在户外风险`, poiId: stop.poi.id })
    }
  }
  return issues
}
