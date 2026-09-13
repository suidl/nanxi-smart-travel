import type { ItineraryStop } from '../domain/types'

export function RouteMap({ stops }: { stops: ItineraryStop[] }) {
  const latitudes = stops.map((stop) => stop.poi.latitude)
  const longitudes = stops.map((stop) => stop.poi.longitude)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)
  const minLon = Math.min(...longitudes)
  const maxLon = Math.max(...longitudes)
  const points = stops.map((stop) => ({
    x: maxLon === minLon ? 50 : 12 + (stop.poi.longitude - minLon) / (maxLon - minLon) * 76,
    y: maxLat === minLat ? 50 : 76 - (stop.poi.latitude - minLat) / (maxLat - minLat) * 60,
  }))
  return (
    <div className="route-map" role="img" aria-label="景点地理位置示意图，非道路导航">
      <div className="map-terrain terrain-a" /><div className="map-terrain terrain-b" />
      <svg viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {stops.map((stop, index) => <div className={`map-stop${points[index].y > 55 ? ' bottom' : ''}${points[index].x > 70 ? ' edge-right' : points[index].x < 30 ? ' edge-left' : ''}`} style={{ left: `${points[index].x}%`, top: `${points[index].y}%` }} key={stop.id}><b>{index + 1}</b><span>{stop.poi.name}</span></div>)}
      <span className="estimate-label">地理位置示意 · 非道路导航 · {stops.length} 个节点</span>
    </div>
  )
}
