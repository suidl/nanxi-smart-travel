import { describe, expect, it } from 'vitest'
import { normalizeOpenMeteoForecast } from '../../netlify/functions/_shared/weather-core'

describe('Open-Meteo weather normalization', () => {
  it('selects the requested date and maps rain into a Chinese summary', () => {
    const result = normalizeOpenMeteoForecast({
      daily: {
        time: ['2026-09-18', '2026-09-19'],
        temperature_2m_min: [20.2, 21.4],
        temperature_2m_max: [27.6, 28.9],
        precipitation_probability_max: [10, 82],
        weather_code: [1, 61],
      },
    }, '2026-09-19', '2026-09-12T12:00:00.000Z')

    expect(result).toEqual({
      date: '2026-09-19', temperatureMin: 21, temperatureMax: 29,
      precipitationProbability: 82, summary: '有雨', source: 'live',
      fetchedAt: '2026-09-12T12:00:00.000Z',
    })
  })

  it('rejects a response that does not contain the requested date', () => {
    expect(() => normalizeOpenMeteoForecast({ daily: { time: [] } }, '2026-09-19', 'now'))
      .toThrow('未包含目标日期')
  })
})
