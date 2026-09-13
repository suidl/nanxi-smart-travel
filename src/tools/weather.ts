import type { WeatherSnapshot } from '../domain/types'

export interface WeatherProvider {
  getForecast(date: string, latitude: number, longitude: number): Promise<WeatherSnapshot>
}
