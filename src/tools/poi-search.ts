import type { NormalizedTripRequest, Poi, WeatherSnapshot } from '../domain/types'

const walkingRank = { low: 0, medium: 1, high: 2 } as const

export function searchPois(
  request: NormalizedTripRequest,
  pois: Poi[],
  weather: WeatherSnapshot,
): Poi[] {
  const rainy = weather.precipitationProbability >= 50
  return pois
    .filter((item) => item.category !== 'transport')
    .filter((item) => walkingRank[item.walkingLevel] <= walkingRank[request.walkingLevel])
    .filter((item) => request.seniors === 0 || item.seniorFriendly)
    .filter((item) => request.children === 0 || item.childFriendly)
    .map((item) => {
      const preferenceScore = request.preferences.filter((preference) => item.tags.includes(preference)).length * 4
      const weatherScore = rainy
        ? item.weatherSuitability === 'indoor' ? 4 : item.weatherSuitability === 'all-weather' ? 3 : 0
        : item.weatherSuitability === 'outdoor' ? 2 : 1
      const varietyScore = item.category === 'food' ? 1 : 2
      return { item, score: preferenceScore + weatherScore + varietyScore }
    })
    .sort((a, b) => b.score - a.score || a.item.durationMinutes - b.item.durationMinutes)
    .map(({ item }) => item)
}
