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
