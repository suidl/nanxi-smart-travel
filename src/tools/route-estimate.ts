import type { Poi, RouteEstimate } from '../domain/types'

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

export function estimateRoute(start: Poi, destinations: Poi[]): RouteEstimate {
  const remaining = [...destinations]
  const ordered: Poi[] = []
  let current = start
  let straightLineKm = 0

  while (remaining.length > 0) {
    remaining.sort((a, b) => distanceKm(current, a) - distanceKm(current, b))
    const next = remaining.shift()!
    straightLineKm += distanceKm(current, next)
    ordered.push(next)
    current = next
  }

  const roadDistance = Number((straightLineKm * 1.28).toFixed(1))
  return {
    orderedPoiIds: ordered.map((item) => item.id),
    totalDistanceKm: roadDistance,
    totalTravelMinutes: Math.max(1, Math.round(roadDistance / 36 * 60)),
    isEstimate: true,
  }
}
