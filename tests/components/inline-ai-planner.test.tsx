import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../src/App'

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  window.history.replaceState({}, '', '/')
})

function stubOnlinePlanning(requests: Array<Record<string, unknown>>) {
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) === '/api/plan') {
      const request = JSON.parse(String(init?.body)) as Record<string, unknown>
      requests.push(request)
      const wantsVillageAndFood = String(request.notes).includes('想多看古村')
      const interpreted = wantsVillageAndFood
        ? { ...request, preferences: ['古村', '美食', '山水'], walkingLevel: 'low' }
        : request
      return new Response(JSON.stringify({ request: interpreted, source: 'ai', model: 'deepseek-flash', summary: String(request.notes) }), { status: 200 })
    }
    if (String(input).startsWith('/api/weather?')) return new Response(JSON.stringify({
      date: new URL(String(input), 'http://localhost').searchParams.get('date'), temperatureMin: 20, temperatureMax: 28,
      precipitationProbability: 18, summary: '晴间多云', source: 'live',
      fetchedAt: '2026-09-12T12:00:00.000Z',
    }), { status: 200 })
    return new Response(null, { status: 404 })
  })
}

describe('in-page AI planning', () => {
  it('regenerates the current itinerary from a natural-language request without opening another page', async () => {
    const requests: Array<Record<string, unknown>> = []
    stubOnlinePlanning(requests)

    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '生成行程' }))
    await screen.findByText('AI 约束解析 · deepseek-flash')
    const originalUrl = window.location.href

    await user.type(screen.getByRole('textbox', { name: '告诉 AI 你的新想法' }), '想多看古村，少走路，安排永嘉小吃')
    await user.click(screen.getByRole('button', { name: '在本页重新生成' }))

    expect(await screen.findByRole('status')).toHaveTextContent('行程已在本页重新核算')
    expect(within(screen.getByLabelText('Agent 执行轨迹')).getByText('想多看古村，少走路，安排永嘉小吃')).toBeInTheDocument()
    expect(requests.at(-1)?.notes).toBe('想多看古村，少走路，安排永嘉小吃')
    expect(screen.getByRole('heading', { name: /(麦饼|素面|粉干|田鱼)/ })).toBeInTheDocument()
    expect(screen.getByText(/新增 \d+ 个、移除 \d+ 个节点/)).toBeInTheDocument()
    expect(window.location.href).toBe(originalUrl)
  })

  it('turns a two-person five-day prompt into five selectable daily itineraries', async () => {
    const requests: Array<Record<string, unknown>> = []
    stubOnlinePlanning(requests)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '生成行程' }))
    await screen.findByText('AI 约束解析 · deepseek-flash')

    await user.type(screen.getByRole('textbox', { name: '告诉 AI 你的新想法' }), '给我规划一个楠溪江双人五日游')
    await user.click(screen.getByRole('button', { name: '在本页重新生成' }))

    expect(await screen.findByRole('button', { name: /第 5 天/ })).toBeInTheDocument()
    expect(requests.at(-1)).toMatchObject({ days: 5, adults: 2, children: 0, seniors: 0, budget: 6000 })
    await user.click(screen.getByRole('button', { name: /第 5 天/ }))
    expect(screen.getByRole('heading', { name: '第 5 天行程' })).toBeInTheDocument()
  })

  it('still changes the route for common requests when AI Gateway is unavailable', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ error: { code: 'OFFLINE' } }), { status: 503 }))
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '生成行程' }))
    await screen.findByText('规则演示解析')

    await user.type(screen.getByRole('textbox', { name: '告诉 AI 你的新想法' }), '多看古村少走路，安排永嘉小吃')
    await user.click(screen.getByRole('button', { name: '在本页重新生成' }))
    expect(await screen.findByRole('heading', { name: /(麦饼|素面|粉干|田鱼)/ })).toBeInTheDocument()
    expect(screen.getByText(/规则重生成结果/)).toBeInTheDocument()
  })
})
