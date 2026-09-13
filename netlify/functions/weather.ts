import { getStore } from '@netlify/blobs'
import type { Config } from '@netlify/functions'
import type { WeatherSnapshot } from '../../src/domain/types'
import { normalizeOpenMeteoForecast } from './_shared/weather-core'

interface WeatherStore {
  get(key: string, options?: { type: 'json' }): Promise<unknown>
  setJSON(key: string, value: unknown): Promise<unknown>
}

interface WeatherDependencies {
  fetchImpl: typeof fetch
  store: WeatherStore
  now: () => Date
}

export function createWeatherHandler(dependencies: WeatherDependencies) {
  return async (req: Request) => {
    if (req.method !== 'GET') return Response.json({ error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 GET' } }, { status: 405 })
    const url = new URL(req.url)
    const date = url.searchParams.get('date') ?? ''
    const latitude = Number(url.searchParams.get('lat'))
    const longitude = Number(url.searchParams.get('lon'))
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return Response.json({ error: { code: 'INVALID_REQUEST', message: '日期或坐标无效' } }, { status: 400 })
    }
    const cacheKey = `${date}:${latitude.toFixed(3)}:${longitude.toFixed(3)}`
    const providerUrl = new URL('https://api.open-meteo.com/v1/forecast')
    providerUrl.search = new URLSearchParams({
      latitude: String(latitude), longitude: String(longitude),
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'Asia/Shanghai', start_date: date, end_date: date,
    }).toString()

    try {
      const providerResponse = await dependencies.fetchImpl(providerUrl)
      if (!providerResponse.ok) throw new Error(`Open-Meteo ${providerResponse.status}`)
      const weather = normalizeOpenMeteoForecast(await providerResponse.json(), date, dependencies.now().toISOString())
      await dependencies.store.setJSON(cacheKey, weather)
      return Response.json(weather, { headers: { 'cache-control': 'public, max-age=900' } })
    } catch {
      const cached = await dependencies.store.get(cacheKey, { type: 'json' }) as WeatherSnapshot | null
      if (cached) return Response.json({ ...cached, source: 'cache' })
      return Response.json({ error: { code: 'WEATHER_UNAVAILABLE', message: '实时天气暂不可用' } }, { status: 503 })
    }
  }
}

export default async (req: Request) => createWeatherHandler({
  fetchImpl: fetch,
  store: getStore({ name: 'nanxi-weather', consistency: 'strong' }) as unknown as WeatherStore,
  now: () => new Date(),
})(req)

export const config: Config = { path: '/api/weather', method: 'GET' }
