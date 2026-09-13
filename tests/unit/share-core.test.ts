import { describe, expect, it } from 'vitest'
import { planTrip } from '../../src/agent/planner'
import { POIS } from '../../src/data/pois'
import { DemoWeatherProvider } from '../../src/demo/demo-adapters'
import { sanitizePlanForSharing } from '../../netlify/functions/_shared/share-core'

describe('shared trip privacy', () => {
  it('removes free-text notes and dietary needs before cloud storage', async () => {
    const plan = await planTrip({
      start: '温州南站', date: '2026-09-19', days: 1,
      adults: 1, children: 1, seniors: 1, budget: 1200,
      preferences: ['山水'], walkingLevel: 'low',
      dietaryNeeds: '过敏信息-secret', notes: '联系电话-secret',
    }, { pois: POIS, weatherProvider: new DemoWeatherProvider() })

    const shared = sanitizePlanForSharing(plan)
    const serialized = JSON.stringify(shared)

    expect(serialized).not.toContain('联系电话-secret')
    expect(serialized).not.toContain('过敏信息-secret')
    expect(shared.request.dietaryNeeds).toEqual([])
  })
})
