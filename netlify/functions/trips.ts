import { getStore } from '@netlify/blobs'
import type { Config, Context } from '@netlify/functions'
import { randomUUID } from 'node:crypto'
import type { PlanResult } from '../../src/domain/types'
import { sanitizePlanForSharing } from './_shared/share-core'

interface TripStore {
  get(key: string, options?: { type: 'json' }): Promise<unknown>
  setJSON(key: string, value: unknown): Promise<unknown>
}

interface TripsDependencies {
  store: TripStore
  createId: () => string
}

export function createTripsHandler(dependencies: TripsDependencies) {
  return async (req: Request, context: { params: Record<string, string | undefined> }) => {
    if (req.method === 'POST') {
      const serialized = await req.text()
      if (serialized.length > 500_000) return Response.json({ error: { code: 'PAYLOAD_TOO_LARGE', message: '行程数据过大' } }, { status: 413 })
      let input: unknown
      try { input = JSON.parse(serialized) } catch { return Response.json({ error: { code: 'INVALID_REQUEST', message: '请求 JSON 无效' } }, { status: 400 }) }
      if (typeof input !== 'object' || input === null || typeof (input as Partial<PlanResult>).id !== 'string' || !Array.isArray((input as Partial<PlanResult>).stops)) {
        return Response.json({ error: { code: 'INVALID_REQUEST', message: '行程结构无效' } }, { status: 400 })
      }
      const id = dependencies.createId()
      await dependencies.store.setJSON(id, sanitizePlanForSharing(input as PlanResult))
      const url = new URL(req.url)
      url.pathname = '/'
      url.search = new URLSearchParams({ trip: id }).toString()
      return Response.json({ id, url: url.toString() }, { status: 201 })
    }

    if (req.method === 'GET') {
      const id = context.params.id
      if (!id || !/^[a-zA-Z0-9-]{6,64}$/.test(id)) return Response.json({ error: { code: 'INVALID_ID', message: '分享编号无效' } }, { status: 400 })
      const plan = await dependencies.store.get(id, { type: 'json' })
      if (!plan) return Response.json({ error: { code: 'NOT_FOUND', message: '分享行程不存在' } }, { status: 404 })
      return Response.json(plan, { headers: { 'cache-control': 'public, max-age=300' } })
    }

    return Response.json({ error: { code: 'METHOD_NOT_ALLOWED', message: '请求方法不支持' } }, { status: 405 })
  }
}

export default async (req: Request, context: Context) => createTripsHandler({
  store: getStore({ name: 'nanxi-shared-trips', consistency: 'strong' }) as unknown as TripStore,
  createId: randomUUID,
})(req, context)

export const config: Config = {
  path: ['/api/trips', '/api/trips/:id'],
  method: ['GET', 'POST'],
}
