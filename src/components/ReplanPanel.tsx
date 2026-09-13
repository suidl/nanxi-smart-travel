import { CloudRain, Gauge, Landmark, PersonStanding, WalletCards } from 'lucide-react'
import { useState } from 'react'
import type { ReplanEvent } from '../domain/types'

const events: Array<{ type: ReplanEvent['type']; label: string; action: string; icon: typeof CloudRain }> = [
  { type: 'rain', label: '午后阵雨', action: '触发午后阵雨', icon: CloudRain },
  { type: 'closure', label: '景点临时关闭', action: '模拟景点关闭', icon: Landmark },
  { type: 'traffic', label: '道路拥堵', action: '模拟道路拥堵', icon: Gauge },
  { type: 'fatigue', label: '老人感到疲劳', action: '模拟体力下降', icon: PersonStanding },
  { type: 'budget', label: '预算降低', action: '模拟预算变化', icon: WalletCards },
]

export function ReplanPanel({ currentTime, onReplan }: { currentTime: string; onReplan: (event: ReplanEvent) => void | Promise<void> }) {
  const [showEvents, setShowEvents] = useState(false)
  const [selected, setSelected] = useState<string>()

  function trigger(item: typeof events[number]) {
    setSelected(item.type)
    setShowEvents(false)
    void onReplan({ type: item.type, label: item.label, currentTime, demo: true, newBudget: item.type === 'budget' ? 900 : undefined })
  }

  return (
    <div className="replan-controls">
      <button className="secondary-action" onClick={() => setShowEvents((value) => !value)}><CloudRain size={16} /> 情况有变，重新规划</button>
      {showEvents && <div className="scenario-menu"><div className="scenario-head"><span>演示情境</span><small>选择途中变化</small></div>{events.map((item) => { const Icon = item.icon; return <button className={selected === item.type ? 'selected' : ''} onClick={() => trigger(item)} key={item.type}><Icon size={15} /> {item.action}</button> })}</div>}
    </div>
  )
}
