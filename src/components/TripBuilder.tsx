import { ArrowRight, CalendarDays, MapPin, ShieldCheck, Sparkles, Users, Wallet } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { TripRequest, WalkingLevel } from '../domain/types'

const START_OPTIONS = ['温州南站', '永嘉站'] as const

function tomorrowDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

const DEFAULT_REQUEST: TripRequest = {
  start: '温州南站',
  date: tomorrowDate(),
  days: 1,
  adults: 1,
  children: 1,
  seniors: 1,
  budget: 1200,
  preferences: ['山水', '古村'],
  walkingLevel: 'low',
  dietaryNeeds: '',
  notes: '希望节奏轻松，午餐尝试永嘉小吃',
}

interface TripBuilderProps {
  onSubmit: (request: TripRequest) => void | Promise<void>
  isPlanning: boolean
  /** 上次生成行程时提交的条件，重新创建时回填，保证与生成结果一致。 */
  initialRequest?: TripRequest
}

export function TripBuilder({ onSubmit, isPlanning, initialRequest }: TripBuilderProps) {
  const [request, setRequest] = useState<TripRequest>(initialRequest ?? DEFAULT_REQUEST)

  function update<K extends keyof TripRequest>(key: K, value: TripRequest[K]) {
    setRequest((current) => ({ ...current, [key]: value }))
  }

  function togglePreference(value: string) {
    update('preferences', request.preferences.includes(value)
      ? request.preferences.filter((item) => item !== value)
      : [...request.preferences, value])
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void onSubmit(request)
  }

  return (
    <div className="builder-page">
      <section className="builder-intro">
        <span className="eyebrow"><Sparkles size={14} /> 行程决策智能体</span>
        <h1>把复杂的楠溪江行程，<br /><em>交给 Agent 去跑。</em></h1>
        <p>它会自主查询天气、筛选点位、估算路线、核算预算，并在情况变化时重排剩余行程。</p>
        <div className="trust-row">
          <span><ShieldCheck size={16} /> 公开数据可追溯</span>
          <span><ShieldCheck size={16} /> 路程明确标注估算</span>
        </div>
      </section>

      <form className="trip-form" onSubmit={submit}>
        <div className="form-heading">
          <div><span className="step-label">01 / 创建行程</span><h2>告诉我这次怎么走</h2></div>
          <span className="demo-tag">评委示例已填充</span>
        </div>

        <label className="field full"><span><MapPin size={15} /> 出发地</span><select aria-label="出发地" value={request.start} onChange={(event) => update('start', event.target.value)}>{START_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select><small className="field-hint">请从永嘉交通节点中选择出发地，仅支持固定选项。</small></label>
        <div className="field-grid">
          <label className="field"><span><CalendarDays size={15} /> 出行日期</span><input type="date" value={request.date} onChange={(event) => update('date', event.target.value)} /></label>
          <label className="field"><span>行程天数 · 1–5 天</span><input aria-label="行程天数" type="number" min="1" max="5" step="1" value={request.days} onChange={(event) => update('days', Number(event.target.value))} /></label>
        </div>

        <fieldset className="people-field"><legend><Users size={15} /> 同行人员</legend><div className="counter-grid">
          {([['成人', 'adults'], ['儿童', 'children'], ['老人', 'seniors']] as const).map(([label, key]) => (
            <label key={key}><span>{label}</span><input aria-label={label} type="number" min="0" max="9" value={request[key]} onChange={(event) => update(key, Number(event.target.value))} /></label>
          ))}
        </div></fieldset>

        <label className="field full"><span><Wallet size={15} /> 总预算</span><div className="money-input"><b>¥</b><input aria-label="总预算" type="number" min="200" step="100" value={request.budget} onChange={(event) => update('budget', Number(event.target.value))} /></div></label>

        <fieldset className="preference-field"><legend>旅行偏好</legend><div className="chip-row">
          {['山水', '古村', '美食', '亲子', '文化'].map((item) => <label className={request.preferences.includes(item) ? 'choice-chip active' : 'choice-chip'} key={item}><input type="checkbox" checked={request.preferences.includes(item)} onChange={() => togglePreference(item)} />{item}</label>)}
        </div></fieldset>

        <label className="field full"><span><Sparkles size={15} /> 一句话补充需求</span><textarea value={request.notes ?? ''} onChange={(event) => update('notes', event.target.value)} placeholder="例如：想吃本地小吃，不要太赶" /></label>

        <label className="field full"><span>步行承受度</span><select value={request.walkingLevel} onChange={(event) => update('walkingLevel', event.target.value as WalkingLevel)}><option value="low">低 · 老人友好</option><option value="medium">中 · 适量步行</option><option value="high">高 · 户外徒步</option></select></label>

        <button className="primary-action" type="submit" disabled={isPlanning}>{isPlanning ? 'Agent 正在规划…' : '生成行程'} <ArrowRight size={18} /></button>
      </form>
    </div>
  )
}
