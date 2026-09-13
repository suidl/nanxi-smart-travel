import { afterEach, describe, expect, it, vi } from 'vitest'
import { planTrip } from '../../src/agent/planner'
import { POIS } from '../../src/data/pois'
import { DemoWeatherProvider } from '../../src/demo/demo-adapters'
import { buildCalendar, buildExportLines, buildShareText, copyShareText } from '../../src/services/export'

afterEach(() => vi.restoreAllMocks())

async function makePlan() {
  return planTrip({
    start: '温州南站', date: '2026-09-19', days: 1,
    adults: 1, children: 1, seniors: 1, budget: 1200,
    preferences: ['山水', '古村'], walkingLevel: 'low', dietaryNeeds: '',
  }, { pois: POIS, weatherProvider: new DemoWeatherProvider() })
}

describe('trip exports', () => {
  it('builds a calendar containing every itinerary stop', async () => {
    const plan = await makePlan()
    const calendar = buildCalendar(plan)

    expect(calendar).toContain('BEGIN:VCALENDAR')
    expect(calendar.match(/BEGIN:VEVENT/g)).toHaveLength(plan.stops.length)
    expect(calendar).toContain('DTSTART:20260919T')
    expect(calendar).toContain(`SUMMARY:${plan.stops[0].poi.name}`)
  })

  it('marks estimated and demo data in portable output', async () => {
    const plan = await makePlan()
    const lines = buildExportLines(plan)
    const shareText = buildShareText(plan)

    expect(lines.join('\n')).toContain('路线距离为估算')
    expect(lines.join('\n')).toContain('演示天气')
    expect(shareText).toContain('楠溪智游')
    expect(shareText).toContain(`预算 ¥${plan.budget.total}`)
  })

  it('falls back to legacy copy when clipboard permission is denied', async () => {
    const plan = await makePlan()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    const legacyCopy = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, 'execCommand', { configurable: true, value: legacyCopy })

    await expect(copyShareText(plan)).resolves.toBeUndefined()
    expect(legacyCopy).toHaveBeenCalledWith('copy')
  })
})
