import { defineConfig } from '@playwright/test'

const deployedBaseUrl = process.env.E2E_BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: deployedBaseUrl ?? 'http://127.0.0.1:5173',
    viewport: { width: 1440, height: 1000 },
    locale: 'zh-CN',
    trace: 'retain-on-failure',
  },
  webServer: deployedBaseUrl ? undefined : {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
  },
})
