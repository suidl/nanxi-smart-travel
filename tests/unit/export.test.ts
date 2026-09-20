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
    expect(lines.join('\n')).toContain(`预计支出 ¥${plan.budget.total}（预算上限 ¥${plan.request.budget}，含 10% 预留）`)
    expect(shareText).toContain('楠溪智游')
    expect(shareText).toContain(`预算 ¥${plan.budget.total}`)
  })

  it('prints per-stop amounts for the whole party so they match the budget breakdown', async () => {
    const plan = await makePlan()
    const lines = buildExportLines(plan).join('\n')
    const calendar = buildCalendar(plan)
    const priced = plan.stops.filter((stop) => stop.poi.costPerPerson)

    expect(priced.length).toBeGreaterThan(0)
    for (const stop of priced) {
      const total = (stop.poi.costPerPerson ?? 0) * plan.request.partySize
      expect(lines).toContain(`¥${stop.poi.costPerPerson}/人 × ${plan.request.partySize} 人 = ¥${total}`)
    }
    expect(lines).not.toContain('费用估算 ¥0')
    const firstPriced = priced[0]
    const firstTotal = (firstPriced.poi.costPerPerson ?? 0) * plan.request.partySize
    expect(calendar).toContain(`费用估算 ¥${firstPriced.poi.costPerPerson}/人 × ${plan.request.partySize} 人 = ¥${firstTotal}`)
  })

  it('exports all five dates rather than putting every stop on the first day', async () => {
    const plan = await makePlan()
    const multiDay = await planTrip({ ...plan.request, days: 5, budget: 6000, dietaryNeeds: '' }, {
      pois: POIS, weatherProvider: new DemoWeatherProvider(),
    })
    const calendar = buildCalendar(multiDay)
    const lines = buildExportLines(multiDay).join('\n')
    expect(calendar).toContain('DTSTART:20260923T')
    expect(lines).toContain('第 5 天')
    expect(buildShareText(multiDay)).toContain('五日行程')
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
