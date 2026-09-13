import { CalendarPlus, Check, Download, Share2 } from 'lucide-react'
import { useState } from 'react'
import type { PlanResult } from '../domain/types'
import { createSharedTrip } from '../services/api'
import { copyShareText, copyText, downloadCalendar, downloadPlanPdf } from '../services/export'

export function TripActions({ plan }: { plan: PlanResult }) {
  const [status, setStatus] = useState<string>()

  async function share() {
    try {
      const shared = await createSharedTrip(plan)
      await copyText(shared.url)
      setStatus('只读分享链接已复制')
    } catch {
      try {
        await copyShareText(plan)
        setStatus('在线分享不可用，已复制分享文案')
      } catch {
        setStatus('复制失败，请检查浏览器权限')
      }
    }
  }

  return (
    <section className="action-panel" aria-label="行程导出">
      <button onClick={() => void downloadPlanPdf(plan)}><Download size={15} /> 导出 PDF</button>
      <button onClick={() => downloadCalendar(plan)}><CalendarPlus size={15} /> 添加到日历</button>
      <button onClick={() => void share()}><Share2 size={15} /> 分享行程</button>
      {status && <span className="action-status" role="status"><Check size={13} /> {status}</span>}
    </section>
  )
}
