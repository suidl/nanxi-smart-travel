import type { WeatherSnapshot } from '../domain/types'
import type { WeatherProvider } from '../tools/weather'

export class DemoWeatherProvider implements WeatherProvider {
  async getForecast(date: string): Promise<WeatherSnapshot> {
    return {
      date,
      temperatureMin: 23,
      temperatureMax: 29,
      precipitationProbability: 35,
      summary: '多云，午后可能有阵雨',
      source: 'demo',
      fetchedAt: new Date().toISOString(),
    }
  }
}
