import type { NormalizedTripRequest, Poi, WeatherSnapshot } from '../domain/types'

const walkingRank = { low: 0, medium: 1, high: 2 } as const

function distanceKm(a: Poi, b: Poi): number {
  const radius = 6371
  const lat = (b.latitude - a.latitude) * Math.PI / 180
  const lon = (b.longitude - a.longitude) * Math.PI / 180
  const sinLat = Math.sin(lat / 2)
  const sinLon = Math.sin(lon / 2)
  const value = sinLat * sinLat
    + Math.cos(a.latitude * Math.PI / 180) * Math.cos(b.latitude * Math.PI / 180) * sinLon * sinLon
  return 2 * radius * Math.asin(Math.sqrt(value))
}

export function searchPois(
  request: NormalizedTripRequest,
  pois: Poi[],
  weather: WeatherSnapshot,
  startPoi?: Poi,
): Poi[] {
  const rainy = weather.precipitationProbability >= 50
  return pois
    .filter((item) => item.category !== 'transport')
    .filter((item) => walkingRank[item.walkingLevel] <= walkingRank[request.walkingLevel])
    .filter((item) => request.seniors === 0 || item.seniorFriendly)
    .filter((item) => request.children === 0 || item.childFriendly)
    .map((item) => {
      const preferenceScore = request.preferences.reduce((score, preference, index) =>
        score + (item.tags.includes(preference) ? (index === 0 ? 8 : 4) : 0), 0)
      const weatherScore = rainy
        ? item.weatherSuitability === 'indoor' ? 4 : item.weatherSuitability === 'all-weather' ? 3 : 0
        : item.weatherSuitability === 'outdoor' ? 2 : 1
      const varietyScore = item.category === 'food' ? 1 : 2
      const distanceScore = startPoi ? Math.max(0, 6 - distanceKm(startPoi, item) / 8) : 0
      return { item, score: preferenceScore + weatherScore + varietyScore + distanceScore }
    })
    .sort((a, b) => b.score - a.score || a.item.durationMinutes - b.item.durationMinutes)
    .map(({ item }) => item)
}
