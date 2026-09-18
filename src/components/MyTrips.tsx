import { useEffect, useState } from 'react'
import { Map, RefreshCw, Calendar, Users, Wallet, Trash2 } from 'lucide-react'
import type { PlanResult } from '../domain/types'
import { loadSavedPlan } from '../services/storage'

interface MyTripsProps {
  onOpen: (plan: PlanResult) => void
  onRestart: () => void
}

export function MyTrips({ onOpen, onRestart }: MyTripsProps) {
  const [plan, setPlan] = useState<PlanResult | undefined>(undefined)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setPlan(loadSavedPlan())
    setLoaded(true)
  }, [])

  function handleClear() {
    localStorage.removeItem('nanxi-smart-travel:last-plan')
    setPlan(undefined)
  }

  return (
    <div className="trips-page">
      <div className="trips-heading">
        <div>
          <span className="eyebrow"><Map size={14} /> 本地行程</span>
          <h1>我的行程</h1>
          <p>保存在本机浏览器中的最近一次行程，刷新不丢失。</p>
        </div>
      </div>

      {!loaded ? null : plan ? (
        <article className="trip-card">
          <header className="trip-card-head">
            <div>
              <h2>{plan.request.start} · {plan.request.days} 日游</h2>
              <div className="trip-meta">
                <span><Calendar size={14} /> {plan.request.date}</span>
                <span><Users size={14} /> {plan.request.partySize} 人</span>
                <span><Wallet size={14} /> ¥{plan.budget.total}</span>
              </div>
            </div>
            {plan.interpretation && (
              <span className={`source-badge ${plan.interpretation.source}`}>
                {plan.interpretation.source === 'ai' ? `AI · ${plan.interpretation.model}` : '本地规则'}
              </span>
            )}
          </header>

          <ol className="trip-stops">
            {plan.stops.map((stop, i) => (
              <li key={stop.id} className="trip-stop">
                <span className="trip-stop-idx">{i + 1}</span>
                <div className="trip-stop-body">
                  <div className="trip-stop-name">
                    <b>{stop.poi.name}</b>
                    <span className="trip-stop-time">{stop.startTime}–{stop.endTime}</span>
                  </div>
                  <p className="trip-stop-desc">{stop.poi.description}</p>
                  <div className="trip-stop-tags">
                    {stop.poi.tags.slice(0, 4).map((t) => (
                      <span key={t} className="poi-tag">{t}</span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <footer className="trip-card-foot">
            <button className="primary-action trip-open" onClick={() => onOpen(plan)}>
              <RefreshCw size={16} /> 打开行程驾驶舱
            </button>
            <button className="ghost-action" onClick={handleClear}>
              <Trash2 size={15} /> 清空本地行程
            </button>
          </footer>
        </article>
      ) : (
        <div className="empty-state">
          <Map size={44} />
          <h2>还没有保存的行程</h2>
          <p>去"创建行程"生成一条，系统会自动保存到本机。</p>
          <button className="primary-action" onClick={onRestart}>去创建行程</button>
        </div>
      )}
    </div>
  )
}
