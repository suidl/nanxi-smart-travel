import { Send, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { requestedDaysFromPrompt } from '../domain/prompt-constraints'

interface InlineAiPlannerProps {
  isPlanning: boolean
  onGenerate: (prompt: string) => Promise<void>
}

export function InlineAiPlanner({ isPlanning, onGenerate }: InlineAiPlannerProps) {
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState('')
  const [updated, setUpdated] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const value = prompt.trim()
    setUpdated(false)
    if (!value) {
      setError('请先输入想调整的行程需求。')
      return
    }
    const requestedDays = requestedDaysFromPrompt(value)
    if (requestedDays !== undefined && (requestedDays < 1 || requestedDays > 5)) {
      setError('目前支持 1–5 天行程，请缩短天数后再试。')
      return
    }
    setError('')
    try {
      await onGenerate(value)
      setUpdated(true)
    } catch {
      setError('行程暂时无法生成，请稍后重试。')
    }
  }

  return (
    <form className="ai-planner" onSubmit={(event) => { void submit(event) }}>
      <div className="ai-planner-copy">
        <span className="eyebrow"><Sparkles size={14} /> AI 行程助手</span>
        <h2>想换个走法？直接告诉我。</h2>
        <p>在当前页面重生成路线，支持自定义 1–5 天。可直接说“楠溪江双人五日游，预算 6000”。</p>
      </div>
      <div className="ai-planner-input">
        <label htmlFor="ai-plan-prompt">告诉 AI 你的新想法</label>
        <div className="ai-planner-compose">
          <textarea id="ai-plan-prompt" value={prompt} onChange={(event) => { setPrompt(event.target.value); setUpdated(false); if (error) setError('') }} maxLength={500} placeholder="例如：想多看古村，少走路，安排永嘉小吃" />
          <button type="submit" disabled={isPlanning}>{isPlanning ? '正在生成…' : '在本页重新生成'} <Send size={15} /></button>
        </div>
        {error && <p className="ai-planner-error" role="alert">{error}</p>}
        {updated && <p className="ai-planner-success" role="status">行程已在本页重新核算，请查看路线变化与逐日安排。</p>}
      </div>
    </form>
  )
}
