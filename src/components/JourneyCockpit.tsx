import { CloudSun, RotateCcw, Wallet } from 'lucide-react'
import { useState } from 'react'
import type { PlanResult, ReplanEvent } from '../domain/types'
import { InlineAiPlanner } from './InlineAiPlanner'
import { ItineraryTimeline } from './ItineraryTimeline'
import { PlanningTrace } from './PlanningTrace'
import { ReplanPanel } from './ReplanPanel'
import { RouteMap } from './RouteMap'
import { TripActions } from './TripActions'

interface JourneyCockpitProps {
  plan: PlanResult
  onReplan: (event: ReplanEvent) => void | Promise<void>
  onRestart: () => void
  onGenerateFromPrompt: (prompt: string) => Promise<void>
  isPlanning: boolean
}

export function JourneyCockpit({ plan, onReplan, onRestart, onGenerateFromPrompt, isPlanning }: JourneyCockpitProps) {
  const [selectedDay, setSelectedDay] = useState(1)
  const activeDay = Math.min(selectedDay, plan.request.days)
  const dayStops = plan.stops.filter((stop) => (stop.dayIndex ?? 1) === activeDay)
  const dayWeather = plan.dailyWeather?.[activeDay - 1] ?? plan.weather
  const currentTime = dayStops[0]?.endTime ?? '12:00'
  const dayLabel = plan.request.days === 1 ? '今日行程' : `第 ${activeDay} 天行程`
  const newPoiIds = plan.changeSummary?.addedPoiIds ?? []
  const removedPoiIds = plan.changeSummary?.replacedPoiIds ?? []
  const changedRoute = newPoiIds.length > 0 || removedPoiIds.length > 0
  const dateLabel = (date: string) => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`
  const visibleIssues = plan.validationIssues.filter((issue) => !issue.poiId || dayStops.some((stop) => stop.poi.id === issue.poiId))
  const firstStop = dayStops[0]
  const actualStartNote = firstStop?.poi.category === 'transport' && firstStop.poi.name !== plan.request.start
    ? `（实际以 ${firstStop.poi.name} 为起点）`
    : ''
  return (
    <div className="cockpit-page">
      <main className="cockpit-main">
        <div className="cockpit-heading">
          <div><span className="eyebrow"><CloudSun size={14} /> {dayWeather.source === 'demo' ? '演示天气' : dayWeather.source === 'cache' ? '缓存天气' : '实时天气'} · {dayWeather.temperatureMin}–{dayWeather.temperatureMax}℃</span><h1>{plan.request.days === 1 ? '楠溪江山水人文一日线' : `楠溪江山水人文 ${plan.request.days} 日行程`}</h1><p>{plan.request.partySize} 人同行 · 从 {plan.request.start} 出发{actualStartNote} · 生成于 {new Date(plan.generatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p><span className={plan.interpretation?.source === 'ai' ? 'source-badge ai' : 'source-badge'}>{plan.interpretation?.source === 'ai' ? `AI 约束解析 · ${plan.interpretation.model}` : '规则演示解析'}</span></div>
          <button className="icon-action" aria-label="重新创建行程" onClick={onRestart}><RotateCcw size={17} /></button>
        </div>

        {plan.changeSummary && <div className="change-banner"><strong>{plan.changeSummary.kind === 'ai' ? `${plan.interpretation?.source === 'ai' ? 'AI' : '规则'}重生成结果` : '行程已重排'}：{plan.changeSummary.reason}</strong><span>{changedRoute ? `新增 ${newPoiIds.length} 个、移除 ${removedPoiIds.length} 个节点` : '景点未变化'}{plan.changeSummary.previousDays && plan.changeSummary.previousDays !== plan.request.days ? ` · ${plan.changeSummary.previousDays} 天改为 ${plan.request.days} 天` : ''} · 预计费用变化 {plan.changeSummary.budgetDelta >= 0 ? '+' : ''}¥{plan.changeSummary.budgetDelta}</span></div>}

        <InlineAiPlanner isPlanning={isPlanning} onGenerate={onGenerateFromPrompt} />

        {plan.request.days > 1 && <div className="day-tabs" role="group" aria-label="选择行程日期">{Array.from({ length: plan.request.days }, (_, index) => {
          const date = plan.dailyWeather?.[index]?.date ?? plan.stops.find((stop) => stop.dayIndex === index + 1)?.date
          return <button type="button" key={index} className={activeDay === index + 1 ? 'active' : ''} aria-pressed={activeDay === index + 1} onClick={() => setSelectedDay(index + 1)}>第 {index + 1} 天{date ? ` · ${dateLabel(date)}` : ''}</button>
        })}</div>}

        <RouteMap stops={dayStops} />

        <div className="metric-row">
          <div><span>预计路程</span><strong>{plan.route.totalDistanceKm} km</strong><small>路程为估算</small></div>
          <div><span>行程预算</span><strong>¥{plan.budget.total}</strong><small>上限 ¥{plan.request.budget}</small></div>
          <div><span>当天天气风险</span><strong>{dayWeather.precipitationProbability}%</strong><small>{dayWeather.summary}</small></div>
        </div>

        {visibleIssues.length > 0 && <section className="risk-panel" aria-label="行程风险"><strong>出发前请核验以下风险</strong><ul>{visibleIssues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}</ul></section>}
        <div className="section-heading"><div><span className="step-label">DAILY ROUTE</span><h2>{dayLabel}</h2></div><ReplanPanel currentTime={currentTime} currentBudget={plan.request.budget} affectedPoiId={dayStops[1]?.poi.id} onReplan={(event) => onReplan({ ...event, dayIndex: activeDay })} /></div>
        <ItineraryTimeline stops={dayStops} />
      </main>

      <aside className="cockpit-rail">
        <PlanningTrace traces={plan.traces} />
        <section className="budget-panel"><div className="panel-title"><div><span className="step-label">BUDGET</span><h2>预算拆分</h2></div><Wallet size={18} /></div>
          {[['交通', plan.budget.transport], ['门票', plan.budget.tickets], ['餐饮', plan.budget.food], ['预留', plan.budget.contingency]].map(([label, value]) => <div className="budget-line" key={label}><span>{label}</span><strong>¥{value}</strong></div>)}
          <div className="budget-total"><span>预计合计</span><strong>¥{plan.budget.total}</strong></div>
          {plan.request.days > 1 && <p className="budget-note">按 {plan.request.days} 天估算；未含住宿、返程交通及个人购物。</p>}
        </section>
        <TripActions plan={plan} />
      </aside>
    </div>
  )
}
