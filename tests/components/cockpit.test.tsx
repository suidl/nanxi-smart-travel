import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { planTrip } from '../../src/agent/planner'
import { JourneyCockpit } from '../../src/components/JourneyCockpit'
import { POIS } from '../../src/data/pois'
import type { ReplanEvent, TripRequest } from '../../src/domain/types'
import { DemoWeatherProvider } from '../../src/demo/demo-adapters'

const request: TripRequest = {
  start: '温州南站', date: '2026-09-19', days: 1,
  adults: 1, children: 1, seniors: 1, budget: 1200,
  preferences: ['山水', '古村'], walkingLevel: 'low', dietaryNeeds: '',
}

describe('JourneyCockpit', () => {
  it('shows the route, timeline, budget and complete agent trace together', async () => {
    const plan = await planTrip(request, {
      pois: POIS,
      weatherProvider: new DemoWeatherProvider(),
      now: () => new Date('2026-09-12T10:00:00.000Z'),
    })
    plan.interpretation = { source: 'ai', model: 'gpt-5.4-mini', summary: '轻松家庭路线' }

    render(<JourneyCockpit plan={plan} onReplan={() => undefined} onRestart={() => undefined} onGenerateFromPrompt={async () => undefined} isPlanning={false} />)

    expect(screen.getByRole('heading', { name: '楠溪江山水人文一日线' })).toBeInTheDocument()
    expect(screen.getByLabelText('景点地理位置示意图，非道路导航')).toBeInTheDocument()
    expect(screen.getByLabelText('行程时间轴')).toBeInTheDocument()
    expect(screen.getAllByText(`¥${plan.budget.total}`)).toHaveLength(2)
    expect(screen.getAllByTestId('tool-trace')).toHaveLength(6)
    expect(screen.getByText('AI 约束解析 · gpt-5.4-mini')).toBeInTheDocument()
  })

  it('exposes the rain scenario as an explicitly labeled demo event', async () => {
    const user = userEvent.setup()
    const plan = await planTrip(request, {
      pois: POIS,
      weatherProvider: new DemoWeatherProvider(),
    })
    let selected: ReplanEvent | undefined
    render(<JourneyCockpit
      plan={plan}
      onReplan={(event) => { selected = event }}
      onRestart={() => undefined}
      onGenerateFromPrompt={async () => undefined}
      isPlanning={false}
    />)

    await user.click(screen.getByRole('button', { name: '情况有变，重新规划' }))
    expect(screen.getByText('演示情境')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '触发午后阵雨' }))

    expect(selected).toMatchObject({ type: 'rain', demo: true, label: '午后阵雨' })
    expect(screen.queryByText('演示情境')).not.toBeInTheDocument()
  })

  it('passes the next stop to the closure scenario and scales the budget scenario', async () => {
    const user = userEvent.setup()
    const plan = await planTrip(request, { pois: POIS, weatherProvider: new DemoWeatherProvider() })
    const selected: ReplanEvent[] = []
    render(<JourneyCockpit plan={plan} onReplan={(event) => { selected.push(event) }} onRestart={() => undefined} onGenerateFromPrompt={async () => undefined} isPlanning={false} />)
    await user.click(screen.getByRole('button', { name: '情况有变，重新规划' }))
    await user.click(screen.getByRole('button', { name: '模拟景点关闭' }))
    expect(selected.at(-1)).toMatchObject({ type: 'closure', affectedPoiId: plan.stops[1].poi.id, dayIndex: 1 })

    await user.click(screen.getByRole('button', { name: '情况有变，重新规划' }))
    await user.click(screen.getByRole('button', { name: '模拟预算变化' }))
    expect(selected.at(-1)).toMatchObject({ type: 'budget', newBudget: 900 })
    expect(screen.queryByRole('button', { name: '模拟道路拥堵' })).not.toBeInTheDocument()
  })
})
