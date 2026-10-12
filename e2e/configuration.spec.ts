import { expect, test } from '@playwright/test'
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import config from '../playwright.config'

const execFileAsync = promisify(execFile)

test('starts the acceptance server with the literal development command', () => {
  expect(config.webServer).toMatchObject({
    command: 'npm run dev',
    env: { POMOKITTY_E2E_PORT: '4173' },
    url: 'http://127.0.0.1:4173/pomokitty/',
    reuseExistingServer: false,
  })
})

test('runs the isolated E2E suite', () => {
  expect(test.info().file).toContain('/e2e/')
})

test('serves development assets at the Pages route', async ({ page }) => {
  await page.goto('/pomokitty/')

  await expect(page.locator('script[src="/@vite/client"]')).toHaveCount(1)
  await expect(page.locator('script[src="/src/main.tsx"]')).toHaveCount(1)
})

test('production build emits Pages-prefixed assets', async () => {
  await execFileAsync('npm', ['run', 'build'])
  const index = await readFile('dist/index.html', 'utf8')

  expect(index).toMatch(/(?:href|src)="\/pomokitty\/assets\//)
  expect(index).toContain('href="/pomokitty/manifest.webmanifest"')
})

test('keeps settings readable in a dedicated scrollable content area at mobile size', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.addInitScript(() => {
    localStorage.setItem('pomokitty:data:v1', JSON.stringify({
      version: 1,
      settings: {
        childName: 'Маша', locale: 'ru', focusMinutes: 25, shortBreakMinutes: 5,
        longBreakMinutes: 15, roundsBeforeLongBreak: 4, autoStartNext: false,
        animationsEnabled: true, notificationsEnabled: false, keepScreenAwake: false,
        selectedSound: 'rain', soundVolume: 0.5,
      },
      history: [],
    }))
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Настройки' }).click()

  const settings = page.locator('.app-section--scroll')
  await expect(settings).toBeVisible()
  await expect(settings).toHaveCSS('overflow-y', 'auto')
  await expect(page.getByRole('heading', { name: 'Настройки' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Очистить все данные' })).toBeVisible()
})
