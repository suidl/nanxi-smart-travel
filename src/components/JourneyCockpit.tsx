import { CloudSun, RotateCcw, Wallet } from 'lucide-react'
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
  const currentTime = plan.stops[0]?.endTime ?? '12:00'
  return (
    <div className="cockpit-page">
      <main className="cockpit-main">
        <div className="cockpit-heading">
          <div><span className="eyebrow"><CloudSun size={14} /> {plan.weather.source === 'demo' ? '演示天气' : plan.weather.source === 'cache' ? '缓存天气' : '实时天气'} · {plan.weather.temperatureMin}–{plan.weather.temperatureMax}℃</span><h1>楠溪江山水人文一日线</h1><p>{plan.request.partySize} 人同行 · 从 {plan.request.start} 出发 · 生成于 {new Date(plan.generatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p><span className={plan.interpretation?.source === 'ai' ? 'source-badge ai' : 'source-badge'}>{plan.interpretation?.source === 'ai' ? `AI 约束解析 · ${plan.interpretation.model}` : '规则演示解析'}</span></div>
          <button className="icon-action" aria-label="重新创建行程" onClick={onRestart}><RotateCcw size={17} /></button>
        </div>

        {plan.changeSummary && <div className="change-banner"><strong>行程已重排：{plan.changeSummary.reason}</strong><span>替换 {plan.changeSummary.replacedPoiIds.length} 个节点 · 预算变化 {plan.changeSummary.budgetDelta >= 0 ? '+' : ''}¥{plan.changeSummary.budgetDelta}</span></div>}

        <InlineAiPlanner isPlanning={isPlanning} onGenerate={onGenerateFromPrompt} />

        <RouteMap stops={plan.stops} />

        <div className="metric-row">
          <div><span>预计路程</span><strong>{plan.route.totalDistanceKm} km</strong><small>路程为估算</small></div>
          <div><span>行程预算</span><strong>¥{plan.budget.total}</strong><small>上限 ¥{plan.request.budget}</small></div>
          <div><span>天气风险</span><strong>{plan.weather.precipitationProbability}%</strong><small>{plan.weather.summary}</small></div>
        </div>

        <div className="section-heading"><div><span className="step-label">TODAY'S ROUTE</span><h2>今日行程</h2></div><ReplanPanel currentTime={currentTime} onReplan={onReplan} /></div>
        <ItineraryTimeline stops={plan.stops} />
      </main>

      <aside className="cockpit-rail">
        <PlanningTrace traces={plan.traces} />
        <section className="budget-panel"><div className="panel-title"><div><span className="step-label">BUDGET</span><h2>预算拆分</h2></div><Wallet size={18} /></div>
          {[['交通', plan.budget.transport], ['门票', plan.budget.tickets], ['餐饮', plan.budget.food], ['预留', plan.budget.contingency]].map(([label, value]) => <div className="budget-line" key={label}><span>{label}</span><strong>¥{value}</strong></div>)}
          <div className="budget-total"><span>预计合计</span><strong>¥{plan.budget.total}</strong></div>
        </section>
        <TripActions plan={plan} />
      </aside>
    </div>
  )
}
