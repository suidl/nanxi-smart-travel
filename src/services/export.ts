import type { PlanResult } from '../domain/types'

function escapeCalendar(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function calendarTime(date: string, time: string) {
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`
}

export function buildCalendar(plan: PlanResult) {
  const events = plan.stops.map((stop) => [
    'BEGIN:VEVENT',
    `UID:${plan.id}-${stop.id}@nanxi-smart-travel`,
    `DTSTART:${calendarTime(plan.request.date, stop.startTime)}`,
    `DTEND:${calendarTime(plan.request.date, stop.endTime)}`,
    `SUMMARY:${escapeCalendar(stop.poi.name)}`,
    `DESCRIPTION:${escapeCalendar(`${stop.note}；费用估算 ¥${stop.estimatedCost}；来源：${stop.poi.sourceUrl}`)}`,
    'END:VEVENT',
  ].join('\r\n')).join('\r\n')

  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//楠溪智游//CN', 'CALSCALE:GREGORIAN', events, 'END:VCALENDAR', ''].join('\r\n')
}

export function buildExportLines(plan: PlanResult) {
  const lines = [
    '楠溪智游 · 行程驾驶舱',
    `${plan.request.date}｜${plan.request.partySize} 人｜从 ${plan.request.start} 出发`,
    `预算 ¥${plan.budget.total} / ¥${plan.request.budget}｜预计路程 ${plan.route.totalDistanceKm} km`,
    `${plan.weather.source === 'demo' ? '演示天气' : '天气'}：${plan.weather.summary}，${plan.weather.temperatureMin}–${plan.weather.temperatureMax}℃`,
    '',
    '今日行程',
  ]

  plan.stops.forEach((stop, index) => {
    lines.push(`${index + 1}. ${stop.startTime}–${stop.endTime}  ${stop.poi.name}`)
    lines.push(`   ${stop.note}｜费用估算 ¥${stop.estimatedCost}`)
  })
  lines.push('', `预算：交通 ${plan.budget.transport} / 门票 ${plan.budget.tickets} / 餐饮 ${plan.budget.food} / 预留 ${plan.budget.contingency}`)
  lines.push('说明：路线距离为估算；票价、开放时间与天气请在出发前以官方实时信息为准。')
  if (plan.changeSummary) lines.push(`动态重排：${plan.changeSummary.reason}`)
  return lines
}

export function buildShareText(plan: PlanResult) {
  const stops = plan.stops.map((stop) => `${stop.startTime} ${stop.poi.name}`).join(' → ')
  return `【楠溪智游】${plan.request.date} 楠溪江一日行程\n${stops}\n预计路程 ${plan.route.totalDistanceKm} km，预算 ¥${plan.budget.total}。\n路线为估算，出发前请核验实时信息。`
}

export function downloadCalendar(plan: PlanResult) {
  downloadBlob(new Blob(['\ufeff', buildCalendar(plan)], { type: 'text/calendar;charset=utf-8' }), `楠溪智游-${plan.request.date}.ics`)
}

export async function copyShareText(plan: PlanResult) {
  await copyText(buildShareText(plan))
}

export async function copyText(text: string) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
    await navigator.clipboard.writeText(text)
    return
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    textarea.remove()
    if (!copied) throw new Error('复制失败')
  }
}

export async function downloadPlanPdf(plan: PlanResult) {
  const { jsPDF } = await import('jspdf')
  const lines = buildExportLines(plan)
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const linesPerPage = 23

  for (let page = 0; page * linesPerPage < lines.length; page += 1) {
    if (page > 0) pdf.addPage()
    const canvas = document.createElement('canvas')
    canvas.width = 1400
    canvas.height = 1980
    const context = canvas.getContext('2d')
    if (!context) throw new Error('当前浏览器无法生成 PDF')
    context.fillStyle = '#fffdf8'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#183d27'
    context.font = '700 54px "Microsoft YaHei", "Noto Sans CJK SC", sans-serif'
    context.fillText(page === 0 ? '楠溪智游 · 行程单' : '楠溪智游 · 行程单（续）', 92, 112)
    context.fillStyle = '#35543e'
    context.font = '30px "Microsoft YaHei", "Noto Sans CJK SC", sans-serif'
    lines.slice(page * linesPerPage, (page + 1) * linesPerPage).forEach((line, index) => {
      context.fillText(line || ' ', 92, 205 + index * 68, 1210)
    })
    context.fillStyle = '#839087'
    context.font = '22px "Microsoft YaHei", sans-serif'
    context.fillText(`第 ${page + 1} 页 · 由楠溪智游生成`, 92, 1900)
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297, undefined, 'FAST')
  }
  pdf.save(`楠溪智游-${plan.request.date}.pdf`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
