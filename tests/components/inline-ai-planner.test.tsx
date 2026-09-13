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
      return new Response(JSON.stringify({ request, source: 'ai', model: 'gpt-5.4-mini', summary: String(request.notes) }), { status: 200 })
    }
    if (String(input).startsWith('/api/weather?')) return new Response(JSON.stringify({
      date: '2026-09-19', temperatureMin: 20, temperatureMax: 28,
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
    await screen.findByText('AI 约束解析 · gpt-5.4-mini')
    const originalUrl = window.location.href

    await user.type(screen.getByRole('textbox', { name: '告诉 AI 你的新想法' }), '想多看古村，少走路，安排永嘉小吃')
    await user.click(screen.getByRole('button', { name: '在本页重新生成' }))

    expect(await screen.findByRole('status')).toHaveTextContent('行程已在本页重新核算')
    expect(within(screen.getByLabelText('Agent 执行轨迹')).getByText('想多看古村，少走路，安排永嘉小吃')).toBeInTheDocument()
    expect(requests.at(-1)?.notes).toBe('想多看古村，少走路，安排永嘉小吃')
    expect(window.location.href).toBe(originalUrl)
  })

  it('does not silently turn a five-day request into a one-day itinerary', async () => {
    stubOnlinePlanning([])
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '生成行程' }))
    await screen.findByText('AI 约束解析 · gpt-5.4-mini')

    await user.type(screen.getByRole('textbox', { name: '告诉 AI 你的新想法' }), '给我规划一个楠溪江双人五日游')
    await user.click(screen.getByRole('button', { name: '在本页重新生成' }))

    expect(screen.getByRole('alert')).toHaveTextContent('目前只支持单日行程')
  })
})
