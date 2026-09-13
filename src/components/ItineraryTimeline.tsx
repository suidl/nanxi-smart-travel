import { ExternalLink } from 'lucide-react'
import type { ItineraryStop } from '../domain/types'

export function ItineraryTimeline({ stops }: { stops: ItineraryStop[] }) {
  return (
    <div className="itinerary" aria-label="行程时间轴">
      {stops.map((stop, index) => (
        <article className={stop.completed ? 'itinerary-stop completed' : 'itinerary-stop'} key={stop.id}>
          <div className="stop-time"><strong>{stop.startTime}</strong><span>{stop.endTime}</span></div>
          <div className="stop-line"><span>{index + 1}</span></div>
          <div className="stop-content">
            <div><h3>{stop.poi.name} {stop.completed && <span className="completed-badge">已完成 · 保留</span>}</h3><p>{stop.poi.description}</p></div>
            <div className="stop-meta"><span>{stop.poi.durationMinutes} 分钟</span><span>步行强度：{stop.poi.walkingLevel === 'low' ? '低' : stop.poi.walkingLevel === 'medium' ? '中' : '高'}</span><a href={`https://uri.amap.com/search?keyword=${encodeURIComponent(stop.poi.name)}`} target="_blank" rel="noreferrer">导航 <ExternalLink size={12} /></a></div>
          </div>
        </article>
      ))}
    </div>
  )
}
