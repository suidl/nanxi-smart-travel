import { createPlanHandler, interpretWithOpenAi } from '../netlify/functions/plan'
import { createTripsHandler } from '../netlify/functions/trips'
import { createWeatherHandler } from '../netlify/functions/weather'

/** KV 存储适配：对齐 netlify/functions 中 TripStore/WeatherStore 的接口形状。 */
function createStore(kv: KVNamespace) {
  return {
    async get(key: string, options?: { type?: string }) {
      if (options?.type === 'json') return await kv.get(key, 'json')
      return await kv.get(key)
    },
    async setJSON(key: string, value: unknown) {
      await kv.put(key, JSON.stringify(value))
    },
  }
}

const TRIES_ID_RE = /^\/api\/trips\/([a-zA-Z0-9-]{6,64})$/

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)

    if (url.pathname === '/api/plan') {
      return createPlanHandler({
        getEnvironment: (name) => {
          const value = env[name as keyof Env]
          return typeof value === 'string' ? value : undefined
        },
        interpret: interpretWithOpenAi,
      })(req)
    }

    if (url.pathname === '/api/weather') {
      return createWeatherHandler({ fetchImpl: fetch, store: createStore(env.WEATHER_CACHE), now: () => new Date() })(req)
    }

    if (url.pathname === '/api/trips' || url.pathname.startsWith('/api/trips/')) {
      const match = TRIES_ID_RE.exec(url.pathname)
      return createTripsHandler({
        store: createStore(env.SHARED_TRIPS),
        createId: () => crypto.randomUUID(),
      })(req, { params: { id: match?.[1] } })
    }

    return Response.json({ error: { code: 'NOT_FOUND', message: '接口不存在' } }, { status: 404 })
  },
} satisfies ExportedHandler<Env>
