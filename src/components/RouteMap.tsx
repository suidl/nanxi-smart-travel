import type { ItineraryStop } from '../domain/types'

export function RouteMap({ stops }: { stops: ItineraryStop[] }) {
  const points = stops.map((_, index) => ({
    x: 12 + index * (76 / Math.max(stops.length - 1, 1)),
    y: 68 - Math.sin((index / Math.max(stops.length - 1, 1)) * Math.PI) * 36,
  }))
  return (
    <div className="route-map" role="img" aria-label="路线示意图">
      <div className="map-terrain terrain-a" /><div className="map-terrain terrain-b" />
      <svg viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {stops.map((stop, index) => <div className="map-stop" style={{ left: `${points[index].x}%`, top: `${points[index].y}%` }} key={stop.id}><b>{index + 1}</b><span>{stop.poi.name}</span></div>)}
      <span className="estimate-label">路线为估算 · {stops.length} 个节点</span>
    </div>
  )
}
