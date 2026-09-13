import type { PlanResult, TripRequest, WeatherSnapshot } from '../domain/types'
import type { WeatherProvider } from '../tools/weather'

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

interface RequestOptions {
  fetchImpl?: FetchLike
  timeoutMs?: number
}

export class ApiError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function requestJson(url: string, init: RequestInit, options: RequestOptions = {}): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8_000)
  try {
    const response = await (options.fetchImpl ?? fetch)(url, { ...init, signal: controller.signal })
    let body: unknown
    try {
      body = await response.json()
    } catch {
      throw new ApiError('INVALID_RESPONSE', '服务返回了无法解析的数据')
    }
    if (!response.ok) {
      const error = typeof body === 'object' && body !== null && 'error' in body
        ? (body as { error?: { code?: string; message?: string } }).error
        : undefined
      throw new ApiError(error?.code ?? 'HTTP_ERROR', error?.message ?? `服务请求失败（${response.status}）`)
    }
    return body
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') throw new ApiError('TIMEOUT', '请求超时')
    throw new ApiError('NETWORK_ERROR', '暂时无法连接在线服务')
  } finally {
    clearTimeout(timeout)
  }
}

export interface TripInterpretation {
  request: TripRequest
  source: 'ai'
  model: string
  summary: string
}

function isTripRequest(value: unknown): value is TripRequest {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<TripRequest>
  return typeof candidate.start === 'string'
    && typeof candidate.date === 'string'
    && typeof candidate.days === 'number' && Number.isInteger(candidate.days) && candidate.days >= 1 && candidate.days <= 5
    && typeof candidate.adults === 'number'
    && typeof candidate.children === 'number'
    && typeof candidate.seniors === 'number'
    && typeof candidate.budget === 'number'
    && Array.isArray(candidate.preferences)
    && ['low', 'medium', 'high'].includes(candidate.walkingLevel ?? '')
    && typeof candidate.dietaryNeeds === 'string'
}

export async function interpretTripRequest(request: TripRequest, options: RequestOptions = {}): Promise<TripInterpretation> {
  const body = await requestJson('/api/plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  }, options)
  if (typeof body !== 'object' || body === null) throw new ApiError('INVALID_RESPONSE', 'AI 解析结果结构无效')
  const result = body as Partial<TripInterpretation>
  if (!isTripRequest(result.request) || result.source !== 'ai' || typeof result.model !== 'string' || typeof result.summary !== 'string') {
    throw new ApiError('INVALID_RESPONSE', 'AI 解析结果结构无效')
  }
  return result as TripInterpretation
}

export class ApiWeatherProvider implements WeatherProvider {
  constructor(private readonly options: RequestOptions = {}) {}

  async getForecast(date: string, latitude: number, longitude: number): Promise<WeatherSnapshot> {
    const query = new URLSearchParams({ date, lat: String(latitude), lon: String(longitude) })
    const body = await requestJson(`/api/weather?${query}`, { method: 'GET' }, this.options)
    if (typeof body !== 'object' || body === null) throw new ApiError('INVALID_RESPONSE', '天气数据结构无效')
    const result = body as Partial<WeatherSnapshot>
    if (typeof result.date !== 'string'
      || typeof result.temperatureMin !== 'number'
      || typeof result.temperatureMax !== 'number'
      || typeof result.precipitationProbability !== 'number'
      || typeof result.summary !== 'string'
      || !['live', 'cache', 'demo'].includes(result.source ?? '')
      || typeof result.fetchedAt !== 'string') {
      throw new ApiError('INVALID_RESPONSE', '天气数据结构无效')
    }
    return result as WeatherSnapshot
  }
}

export class ResilientWeatherProvider implements WeatherProvider {
  constructor(
    private readonly primary: WeatherProvider,
    private readonly fallback: WeatherProvider,
  ) {}

  async getForecast(date: string, latitude: number, longitude: number) {
    try {
      return await this.primary.getForecast(date, latitude, longitude)
    } catch {
      return this.fallback.getForecast(date, latitude, longitude)
    }
  }
}

export async function createSharedTrip(plan: PlanResult, options: RequestOptions = {}) {
  const body = await requestJson('/api/trips', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(plan),
  }, options)
  if (typeof body !== 'object' || body === null) throw new ApiError('INVALID_RESPONSE', '分享服务返回结构无效')
  const result = body as { id?: unknown; url?: unknown }
  if (typeof result.id !== 'string' || typeof result.url !== 'string') throw new ApiError('INVALID_RESPONSE', '分享服务返回结构无效')
  return { id: result.id, url: result.url }
}

export async function loadSharedTrip(id: string, options: RequestOptions = {}): Promise<PlanResult> {
  const body = await requestJson(`/api/trips/${encodeURIComponent(id)}`, { method: 'GET' }, options)
  if (typeof body !== 'object' || body === null) throw new ApiError('INVALID_RESPONSE', '分享行程结构无效')
  const plan = body as Partial<PlanResult>
  if (typeof plan.id !== 'string' || !Array.isArray(plan.stops)) throw new ApiError('INVALID_RESPONSE', '分享行程结构无效')
  return plan as PlanResult
}
