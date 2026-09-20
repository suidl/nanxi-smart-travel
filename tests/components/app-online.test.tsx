import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../src/App'

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  window.history.replaceState({}, '', '/')
})

describe('App online orchestration', () => {
  it('uses AI interpretation and live weather when Netlify APIs are available', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/plan') return new Response(JSON.stringify({
        request: {
          start: '温州南站', date: '2026-09-19', days: 1,
          adults: 1, children: 1, seniors: 1, budget: 1200,
          preferences: ['山水', '古村', '美食'], walkingLevel: 'low', dietaryNeeds: '',
          notes: '希望节奏轻松，午餐尝试永嘉小吃',
        },
        source: 'ai', model: 'deepseek-flash', summary: '适合家庭的轻松山水美食路线',
      }), { status: 200 })
      if (String(input).startsWith('/api/weather?')) return new Response(JSON.stringify({
        date: '2026-09-19', temperatureMin: 20, temperatureMax: 28,
        precipitationProbability: 18, summary: '晴间多云', source: 'live',
        fetchedAt: '2026-09-12T12:00:00.000Z',
      }), { status: 200 })
      return new Response(null, { status: 404 })
    })
    vi.stubGlobal('fetch', fetchImpl)
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '生成行程' }))

    expect(await screen.findByText('AI 约束解析 · deepseek-flash')).toBeInTheDocument()
    expect(screen.getByText(/实时天气/)).toBeInTheDocument()
    expect(screen.getByText('适合家庭的轻松山水美食路线')).toBeInTheDocument()
  })

  it('restores the submitted party size when returning to the builder after planning', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('offline') })
    const user = userEvent.setup()
    render(<App />)

    await user.clear(screen.getByRole('spinbutton', { name: '儿童' }))
    await user.type(screen.getByRole('spinbutton', { name: '儿童' }), '0')
    await user.clear(screen.getByRole('spinbutton', { name: '老人' }))
    await user.type(screen.getByRole('spinbutton', { name: '老人' }), '2')
    await user.click(screen.getByRole('button', { name: '生成行程' }))

    expect(await screen.findByText('规则演示解析')).toBeInTheDocument()
    expect(screen.getByText(/3 人同行/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '重新创建行程' }))

    expect(screen.getByRole('spinbutton', { name: '成人' })).toHaveValue(1)
    expect(screen.getByRole('spinbutton', { name: '儿童' })).toHaveValue(0)
    expect(screen.getByRole('spinbutton', { name: '老人' })).toHaveValue(2)
  })
})
