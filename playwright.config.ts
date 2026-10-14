import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173/pomokitty/',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-chromium-ru',
      use: {
        ...devices['iPhone 13'],
        browserName: 'chromium',
        locale: 'ru-RU',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    env: { POMOKITTY_E2E_PORT: '4173' },
    url: 'http://127.0.0.1:4173/app/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
