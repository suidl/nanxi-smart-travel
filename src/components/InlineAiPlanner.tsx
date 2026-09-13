import { Send, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'

interface InlineAiPlannerProps {
  isPlanning: boolean
  onGenerate: (prompt: string) => Promise<void>
}

const MULTI_DAY_REQUEST = /(?:[2-9]\d*|\d{2,}|[二两三四五六七八九十百]+)\s*(?:天|日)(?:游|行程|旅行)?/

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
    if (MULTI_DAY_REQUEST.test(value)) {
      setError('目前只支持单日行程，不能把多日游当作一日行程生成。')
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
        <p>沿用本次日期、人数和预算，在当前页面重生成单日路线。</p>
      </div>
      <div className="ai-planner-input">
        <label htmlFor="ai-plan-prompt">告诉 AI 你的新想法</label>
        <div className="ai-planner-compose">
          <textarea id="ai-plan-prompt" value={prompt} onChange={(event) => { setPrompt(event.target.value); setUpdated(false); if (error) setError('') }} maxLength={500} placeholder="例如：想多看古村，少走路，安排永嘉小吃" />
          <button type="submit" disabled={isPlanning}>{isPlanning ? '正在生成…' : '在本页重新生成'} <Send size={15} /></button>
        </div>
        {error && <p className="ai-planner-error" role="alert">{error}</p>}
        {updated && <p className="ai-planner-success" role="status">行程已在本页重新核算；路线可能因点位约束保持不变。</p>}
      </div>
    </form>
  )
}
