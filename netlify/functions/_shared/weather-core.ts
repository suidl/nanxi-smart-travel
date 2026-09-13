import type { WeatherSnapshot } from '../../../src/domain/types'

interface OpenMeteoDaily {
  time?: unknown
  temperature_2m_min?: unknown
  temperature_2m_max?: unknown
  precipitation_probability_max?: unknown
  weather_code?: unknown
}

function numberAt(value: unknown, index: number): number | undefined {
  if (!Array.isArray(value) || typeof value[index] !== 'number') return undefined
  return value[index]
}

function weatherSummary(code: number, rainProbability: number) {
  if (code >= 51 || rainProbability >= 60) return '有雨'
  if (code >= 3) return '多云'
  if (code >= 1) return '晴间多云'
  return '晴'
}

export function normalizeOpenMeteoForecast(body: unknown, date: string, fetchedAt: string): WeatherSnapshot {
  const daily = typeof body === 'object' && body !== null && 'daily' in body
    ? (body as { daily?: OpenMeteoDaily }).daily
    : undefined
  const dates = Array.isArray(daily?.time) ? daily.time : []
  const index = dates.indexOf(date)
  if (index < 0) throw new Error('天气响应未包含目标日期')
  const temperatureMin = numberAt(daily?.temperature_2m_min, index)
  const temperatureMax = numberAt(daily?.temperature_2m_max, index)
  const precipitationProbability = numberAt(daily?.precipitation_probability_max, index)
  const weatherCode = numberAt(daily?.weather_code, index)
  if ([temperatureMin, temperatureMax, precipitationProbability, weatherCode].some((value) => value === undefined)) {
    throw new Error('天气响应缺少必要字段')
  }
  return {
    date,
    temperatureMin: Math.round(temperatureMin!),
    temperatureMax: Math.round(temperatureMax!),
    precipitationProbability: Math.round(precipitationProbability!),
    summary: weatherSummary(weatherCode!, precipitationProbability!),
    source: 'live',
    fetchedAt,
  }
}
