import { Check, CircleAlert, LoaderCircle } from 'lucide-react'
import type { ToolTrace } from '../domain/types'

export function PlanningTrace({ traces }: { traces: ToolTrace[] }) {
  return (
    <section className="trace-panel" aria-label="Agent 执行轨迹">
      <div className="panel-title"><div><span className="step-label">AGENT TRACE</span><h2>执行轨迹</h2></div><span className="verified">已完成</span></div>
      <div className="trace-list">
        {traces.map((trace) => (
          <article className="trace-item" data-testid="tool-trace" key={trace.kind}>
            <span className={`trace-icon ${trace.status}`}>
              {trace.status === 'success' ? <Check size={12} /> : trace.status === 'error' ? <CircleAlert size={12} /> : <LoaderCircle size={12} />}
            </span>
            <div><strong>{trace.label}</strong><p>{trace.resultSummary}</p><span>{trace.durationMs} ms</span></div>
          </article>
        ))}
      </div>
    </section>
  )
}
