import { expect, test } from '@playwright/test'

test('production site creates a trip with live weather and cloud sharing', async ({ page }) => {
  test.skip(!process.env.E2E_BASE_URL, '仅在指定公网地址时执行')

  await page.goto('/')
  await page.getByRole('button', { name: '生成行程' }).click()

  await expect(page.getByRole('heading', { name: '楠溪江山水人文一日线' })).toBeVisible()
  await expect(page.getByText(/实时天气|缓存天气/)).toBeVisible()
  await page.getByRole('button', { name: '分享行程' }).click()
  await expect(page.getByRole('status')).toContainText('分享链接已复制')
})
