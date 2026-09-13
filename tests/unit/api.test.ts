import { describe, expect, it, vi } from 'vitest'
import type { TripRequest } from '../../src/domain/types'
import type { PlanResult } from '../../src/domain/types'
import { ApiError, ApiWeatherProvider, ResilientWeatherProvider, createSharedTrip, interpretTripRequest, loadSharedTrip } from '../../src/services/api'

const request: TripRequest = {
  start: '温州南站', date: '2026-09-19', days: 1,
  adults: 1, children: 1, seniors: 1, budget: 1200,
  preferences: ['山水', '古村'], walkingLevel: 'low', dietaryNeeds: '',
  notes: '希望午餐吃本地小吃',
}

describe('Netlify API client', () => {
  it('returns a validated AI interpretation', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      request: { ...request, preferences: ['山水', '美食'] },
      source: 'ai', model: 'gpt-5.4-mini', summary: '轻松的山水美食路线',
    }), { status: 200, headers: { 'content-type': 'application/json' } }))

    const result = await interpretTripRequest(request, { fetchImpl })

    expect(result).toEqual({
      request: { ...request, preferences: ['山水', '美食'] },
      source: 'ai', model: 'gpt-5.4-mini', summary: '轻松的山水美食路线',
    })
  })

  it('surfaces an explicit model-not-configured error code', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      error: { code: 'MODEL_NOT_CONFIGURED', message: 'AI Gateway 尚未启用' },
    }), { status: 503, headers: { 'content-type': 'application/json' } }))

    await expect(interpretTripRequest(request, { fetchImpl })).rejects.toMatchObject({
      name: 'ApiError', code: 'MODEL_NOT_CONFIGURED',
    })
  })

  it('rejects malformed successful responses before they reach the planner', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"source":"ai"}', {
      status: 200, headers: { 'content-type': 'application/json' },
    }))

    await expect(interpretTripRequest(request, { fetchImpl })).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    })
  })

  it('aborts a request that exceeds the configured timeout', async () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
    const pending = interpretTripRequest(request, { fetchImpl, timeoutMs: 100 })
    const rejection = expect(pending).rejects.toEqual(new ApiError('TIMEOUT', '请求超时'))
    await vi.advanceTimersByTimeAsync(101)

    await rejection
    vi.useRealTimers()
  })

  it('maps the weather endpoint to a live weather snapshot', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      date: '2026-09-19', temperatureMin: 21, temperatureMax: 28,
      precipitationProbability: 15, summary: '晴间多云', source: 'live',
      fetchedAt: '2026-09-12T12:00:00.000Z',
    }), { status: 200, headers: { 'content-type': 'application/json' } }))

    const weather = await new ApiWeatherProvider({ fetchImpl }).getForecast('2026-09-19', 28.3, 120.7)

    expect(weather).toMatchObject({ date: '2026-09-19', source: 'live', precipitationProbability: 15 })
  })

  it('uses the labeled demo provider when online weather is unavailable', async () => {
    const fallback = new ResilientWeatherProvider(
      { getForecast: async () => { throw new ApiError('NETWORK_ERROR', 'offline') } },
      { getForecast: async () => ({
        date: '2026-09-19', temperatureMin: 23, temperatureMax: 29,
        precipitationProbability: 35, summary: '演示天气', source: 'demo', fetchedAt: 'demo-at',
      }) },
    )

    const weather = await fallback.getForecast('2026-09-19', 28.3, 120.7)

    expect(weather.source).toBe('demo')
  })

  it('creates and reloads a read-only shared trip', async () => {
    const plan = { id: 'trip-1', stops: [] } as unknown as PlanResult
    const fetchImpl = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') return new Response(JSON.stringify({ id: 'share-1', url: 'https://demo.example/?trip=share-1' }), { status: 201 })
      if (String(url).endsWith('/share-1')) return new Response(JSON.stringify(plan), { status: 200 })
      return new Response(null, { status: 404 })
    })

    const shared = await createSharedTrip(plan, { fetchImpl })
    const loaded = await loadSharedTrip(shared.id, { fetchImpl })

    expect(shared).toEqual({ id: 'share-1', url: 'https://demo.example/?trip=share-1' })
    expect(loaded).toMatchObject({ id: 'trip-1', stops: [] })
  })
})
