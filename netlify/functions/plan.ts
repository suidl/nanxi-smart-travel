import type { Config } from '@netlify/functions'
import OpenAI from 'openai'
import type { TripRequest } from '../../src/domain/types'
import { findMissingConstraints } from '../../src/domain/constraints'
import { mergeModelInterpretation, type ModelInterpretation } from './_shared/plan-core'

interface PlanDependencies {
  getEnvironment: (name: string) => string | undefined
  interpret: (request: TripRequest, config: { apiKey: string; baseURL: string; model: string }) => Promise<ModelInterpretation>
}

interface RuntimeEnvironment {
  get(name: string): string | undefined
}

export function getRuntimeEnvironment(
  name: string,
  processEnvironment: Record<string, string | undefined> = process.env,
  netlifyEnvironment: RuntimeEnvironment | undefined = (globalThis as typeof globalThis & {
    Netlify?: { env?: RuntimeEnvironment }
  }).Netlify?.env,
) {
  return processEnvironment[name] ?? netlifyEnvironment?.get(name)
}

export function resolveGatewayEnvironment(getEnvironment: PlanDependencies['getEnvironment']) {
  return {
    apiKey: getEnvironment('OPENAI_API_KEY') ?? getEnvironment('NETLIFY_AI_GATEWAY_KEY'),
    baseURL: getEnvironment('OPENAI_BASE_URL')
      ?? getEnvironment('NETLIFY_AI_GATEWAY_BASE_URL')
      ?? getEnvironment('NETLIFY_AI_GATEWAY_URL'),
  }
}

function isRequest(value: unknown): value is TripRequest {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Partial<TripRequest>
  return typeof item.start === 'string' && typeof item.date === 'string'
    && typeof item.days === 'number' && Number.isInteger(item.days) && item.days >= 1 && item.days <= 5
    && typeof item.adults === 'number' && typeof item.children === 'number' && typeof item.seniors === 'number'
    && typeof item.budget === 'number' && Array.isArray(item.preferences)
    && ['low', 'medium', 'high'].includes(item.walkingLevel ?? '')
    && typeof item.dietaryNeeds === 'string'
}

export function createPlanHandler(dependencies: PlanDependencies) {
  return async (req: Request) => {
    if (req.method !== 'POST') return Response.json({ error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 POST' } }, { status: 405 })
    let input: unknown
    try { input = await req.json() } catch { return Response.json({ error: { code: 'INVALID_REQUEST', message: '请求 JSON 无效' } }, { status: 400 }) }
    if (!isRequest(input) || findMissingConstraints(input).length > 0) {
      return Response.json({ error: { code: 'INVALID_REQUEST', message: '行程条件不完整' } }, { status: 400 })
    }

    const { apiKey, baseURL } = resolveGatewayEnvironment(dependencies.getEnvironment)
    if (!apiKey || !baseURL) {
      return Response.json({ error: { code: 'MODEL_NOT_CONFIGURED', message: 'AI Gateway 尚未启用' } }, { status: 503 })
    }
    const model = dependencies.getEnvironment('AI_MODEL') ?? 'gpt-5.4-mini'
    try {
      const interpretation = await dependencies.interpret(input, { apiKey, baseURL, model })
      const merged = mergeModelInterpretation(input, interpretation)
      return Response.json({ ...merged, source: 'ai', model })
    } catch {
      return Response.json({ error: { code: 'MODEL_FAILED', message: 'AI 解析暂时失败，请使用演示模式' } }, { status: 502 })
    }
  }
}

const handler = createPlanHandler({
  getEnvironment: getRuntimeEnvironment,
  interpret: async (request, config) => {
    const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL })
    const response = await client.responses.create({
      model: config.model,
      store: false,
      instructions: '你是楠溪江行程约束解析器。只提炼用户偏好、步行强度、饮食需求并写一句摘要，不生成景点、价格、路线或未经提供的事实。preferences 只能从山水、古村、美食、亲子、文化中选择；“小吃”归为美食，“少走路”归为 low。优先理解 notes 中的新需求。',
      input: JSON.stringify(request),
      max_output_tokens: 500,
      text: {
        format: {
          type: 'json_schema',
          name: 'trip_interpretation',
          strict: true,
          schema: {
            type: 'object', additionalProperties: false,
            properties: {
              preferences: { type: 'array', minItems: 1, maxItems: 5, items: { type: 'string', enum: ['山水', '古村', '美食', '亲子', '文化'] } },
              walkingLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
              dietaryNeeds: { type: 'string' },
              summary: { type: 'string', maxLength: 80 },
            },
            required: ['preferences', 'walkingLevel', 'dietaryNeeds', 'summary'],
          },
        },
      },
    })
    return JSON.parse(response.output_text) as ModelInterpretation
  },
})

export default handler

export const config: Config = { path: '/api/plan', method: 'POST' }
