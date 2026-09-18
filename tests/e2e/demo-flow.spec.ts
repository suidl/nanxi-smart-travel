import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

test('judge demo creates, replans and exports a complete itinerary', async ({ page }) => {
  await mkdir('artifacts/exports', { recursive: true })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /把复杂的楠溪江行程/ })).toBeVisible()
  await page.screenshot({ path: 'artifacts/ui/01-builder.png', fullPage: true })

  await page.getByRole('button', { name: '生成行程' }).click()
  await expect(page.getByRole('heading', { name: '楠溪江山水人文一日线' })).toBeVisible()
  await expect(page.getByTestId('tool-trace')).toHaveCount(6)
  await expect(page.getByLabel('行程时间轴').locator('.itinerary-stop')).toHaveCount(4)
  await page.screenshot({ path: 'artifacts/ui/02-cockpit.png', fullPage: true })

  await page.getByRole('button', { name: '情况有变，重新规划' }).click()
  await expect(page.getByText('演示情境')).toBeVisible()
  await page.getByRole('button', { name: '触发午后阵雨' }).click()
  await expect(page.getByText(/行程已重排：/)).toBeVisible()
  await expect(page.getByText(/午后阵雨/).first()).toBeVisible()
  await expect(page.getByText('已完成 · 保留')).toBeVisible()
  await expect(page.getByText('演示情境')).toBeHidden()
  await page.screenshot({ path: 'artifacts/ui/03-rain-replan.png', fullPage: true })

  const calendarDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: '添加到日历' }).click()
  const calendar = await calendarDownload
  await expect(calendar.suggestedFilename()).toMatch(/\.ics$/)
  await calendar.saveAs('artifacts/exports/楠溪智游-demo.ics')

  const pdfDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出 PDF' }).click()
  const pdf = await pdfDownload
  await expect(pdf.suggestedFilename()).toMatch(/\.pdf$/)
  await pdf.saveAs('artifacts/exports/楠溪智游-demo.pdf')

  await page.getByRole('button', { name: '分享行程' }).click()
  await expect(page.getByRole('status')).toContainText('已复制')
})

test('mobile cockpit fits a phone viewport without horizontal overflow', async ({ page }) => {
  await mkdir('artifacts/ui', { recursive: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: '生成行程' }).click()

  await expect(page.getByRole('heading', { name: '楠溪江山水人文一日线' })).toBeVisible()
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
  await page.screenshot({ path: 'artifacts/ui/04-mobile-cockpit.png', fullPage: true })
})

test('inline AI changes the visible route and supports a custom five-day trip', async ({ page }) => {
  await mkdir('artifacts/ui', { recursive: true })
  await page.route('**/api/plan', async (route) => {
    const request = route.request().postDataJSON()
    const preferences = String(request.notes).includes('多看古村')
      ? ['古村', '美食', '山水']
      : request.preferences
    await route.fulfill({ json: { request: { ...request, preferences }, source: 'ai', model: 'deepseek-flash', summary: String(request.notes) } })
  })
  await page.route('**/api/weather?*', async (route) => {
    const date = new URL(route.request().url()).searchParams.get('date')
    await route.fulfill({ json: { date, temperatureMin: 20, temperatureMax: 28, precipitationProbability: 18, summary: '晴间多云', source: 'live', fetchedAt: new Date().toISOString() } })
  })
  await page.goto('/')
  await page.getByRole('button', { name: '生成行程' }).click()
  await expect(page.getByRole('heading', { name: '楠溪江山水人文一日线' })).toBeVisible()

  await page.getByRole('textbox', { name: '告诉 AI 你的新想法' }).fill('多看古村少走路，安排永嘉小吃')
  await page.getByRole('button', { name: '在本页重新生成' }).click()
  await expect(page.getByRole('heading', { name: '永嘉麦饼体验' })).toBeVisible()
  await expect(page.getByText(/新增 \d+ 个、移除 \d+ 个节点/)).toBeVisible()

  await page.getByRole('textbox', { name: '告诉 AI 你的新想法' }).fill('楠溪江双人五日游，预算 6000')
  await page.getByRole('button', { name: '在本页重新生成' }).click()
  await expect(page.getByRole('button', { name: /第 5 天/ })).toBeVisible()
  await page.getByRole('button', { name: /第 5 天/ }).click()
  await expect(page.getByRole('heading', { name: '第 5 天行程' })).toBeVisible()
  await expect(page.getByLabel('行程时间轴').locator('.itinerary-stop')).not.toHaveCount(0)
  await page.screenshot({ path: 'artifacts/ui/05-five-day.png', fullPage: true })
})
