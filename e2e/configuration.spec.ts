import { expect, test } from '@playwright/test'

test('runs the isolated E2E suite', () => {
  expect(test.info().file).toContain('/e2e/')
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
