import { describe, expect, it, vi } from 'vitest'
import type { PlanResult, TripRequest, WeatherSnapshot } from '../../src/domain/types'
import { createPlanHandler, getRuntimeEnvironment, resolveGatewayEnvironment } from '../../netlify/functions/plan'
import { createTripsHandler } from '../../netlify/functions/trips'
import { createWeatherHandler } from '../../netlify/functions/weather'

const request: TripRequest = {
  start: '温州南站', date: '2026-09-19', days: 1,
  adults: 1, children: 1, seniors: 1, budget: 1200,
  preferences: ['山水'], walkingLevel: 'low', dietaryNeeds: '',
}

describe('Netlify function handlers', () => {
  it('reads dynamically injected gateway variables from Netlify.env', () => {
    const netlifyEnvironment = {
      get: (name: string) => name === 'NETLIFY_AI_GATEWAY_KEY' ? 'dynamic-key' : undefined,
    }

    expect(getRuntimeEnvironment('NETLIFY_AI_GATEWAY_KEY', {}, netlifyEnvironment)).toBe('dynamic-key')
  })

  it('uses the collision-free Netlify gateway variables as a fallback', () => {
    const values: Record<string, string> = {
      NETLIFY_AI_GATEWAY_KEY: 'gateway-key',
      NETLIFY_AI_GATEWAY_URL: 'https://gateway.example',
    }

    expect(resolveGatewayEnvironment((name) => values[name])).toEqual({
      apiKey: 'gateway-key',
      baseURL: 'https://gateway.example',
    })
  })

  it('supports the current Netlify gateway base URL variable name', () => {
    const values: Record<string, string> = {
      NETLIFY_AI_GATEWAY_KEY: 'gateway-key',
      NETLIFY_AI_GATEWAY_BASE_URL: 'https://gateway.example',
    }

    expect(resolveGatewayEnvironment((name) => values[name])).toEqual({
      apiKey: 'gateway-key',
      baseURL: 'https://gateway.example',
    })
  })

  it('returns an explicit error when AI Gateway is unavailable', async () => {
    const handler = createPlanHandler({
      getEnvironment: () => undefined,
      interpret: vi.fn(),
    })

    const response = await handler(new Request('http://localhost/api/plan', {
      method: 'POST', body: JSON.stringify(request),
    }))

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: { code: 'MODEL_NOT_CONFIGURED', message: 'AI Gateway 尚未启用' },
    })
  })

  it('returns cached weather when the live provider fails', async () => {
    const cached: WeatherSnapshot = {
      date: '2026-09-19', temperatureMin: 20, temperatureMax: 27,
      precipitationProbability: 30, summary: '多云', source: 'live', fetchedAt: 'cached-at',
    }
    const handler = createWeatherHandler({
      fetchImpl: vi.fn().mockRejectedValue(new Error('offline')),
      store: { get: vi.fn().mockResolvedValue(cached), setJSON: vi.fn() },
      now: () => new Date('2026-09-12T12:00:00.000Z'),
    })

    const response = await handler(new Request('http://localhost/api/weather?date=2026-09-19&lat=28.3&lon=120.7'))

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ source: 'cache', fetchedAt: 'cached-at' })
  })

  it('stores only a sanitized plan and retrieves it by share id', async () => {
    const values = new Map<string, unknown>()
    const store = {
      setJSON: vi.fn(async (key: string, value: unknown) => { values.set(key, value) }),
      get: vi.fn(async (key: string) => values.get(key) ?? null),
    }
    const handler = createTripsHandler({ store, createId: () => 'share-1' })
    const plan = {
      id: 'trip-1', stops: [],
      request: { dietaryNeeds: ['过敏-secret'], notes: '电话-secret' },
    } as unknown as PlanResult

    const created = await handler(new Request('https://demo.example/api/trips', {
      method: 'POST', body: JSON.stringify(plan),
    }), { params: {} })
    const loaded = await handler(new Request('https://demo.example/api/trips/share-1'), { params: { id: 'share-1' } })
    const serialized = JSON.stringify(await loaded.json())

    expect(created.status).toBe(201)
    expect(serialized).not.toContain('secret')
  })
})
