import { expect, test } from '@playwright/test'

const requiredDiagnosticViewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 393, height: 852 },
] as const

for (const viewport of requiredDiagnosticViewports) {
  test(`keeps the timer unscrolled and non-overlapping at ${viewport.width} by ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/pomokitty/')
    await page.getByLabel('Как тебя зовут?').fill('Маша')
    await page.getByRole('button', { name: 'Продолжить' }).click()

    const geometry = await page.locator('.timer-screen').evaluate((timerScreen) => {
      const task = timerScreen.querySelector('input')
      const primaryAction = timerScreen.querySelector('.timer-screen__primary')
      if (!task || !primaryAction) throw new Error('Timer controls are missing')

      const taskBox = task.getBoundingClientRect()
      const primaryBox = primaryAction.getBoundingClientRect()
      return {
        pageScrollable: document.documentElement.scrollHeight > window.innerHeight,
        timerScrollable: timerScreen.scrollHeight > timerScreen.clientHeight,
        taskBottom: taskBox.bottom,
        primaryTop: primaryBox.top,
        primaryBottom: primaryBox.bottom,
        viewportHeight: window.innerHeight,
      }
    })

    expect(geometry.pageScrollable).toBe(false)
    expect(geometry.timerScrollable).toBe(false)
    expect(geometry.primaryTop).toBeGreaterThan(geometry.taskBottom)
    expect(geometry.primaryBottom).toBeLessThanOrEqual(geometry.viewportHeight)
  })
}

test('first mobile visit stores the Russian child name and keeps the timer inside 375 by 667', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/pomokitty/')

  await page.getByLabel('Как тебя зовут?').fill('Маша')
  await page.getByRole('button', { name: 'Продолжить' }).click()

  await expect(page.getByRole('main', { name: 'pomokitty' })).toBeVisible()
  await expect(page.getByText('Привет, Маша')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Начать' })).toBeVisible()

  const geometry = await page.locator('.timer-screen').evaluate((timerScreen) => {
    const task = timerScreen.querySelector('input')
    const primaryAction = timerScreen.querySelector('.timer-screen__primary')
    if (!task || !primaryAction) throw new Error('Timer controls are missing')

    const taskBox = task.getBoundingClientRect()
    const primaryBox = primaryAction.getBoundingClientRect()
    return {
      pageScrollable: document.documentElement.scrollHeight > window.innerHeight,
      timerScrollable: timerScreen.scrollHeight > timerScreen.clientHeight,
      taskBottom: taskBox.bottom,
      primaryTop: primaryBox.top,
      primaryBottom: primaryBox.bottom,
      viewportHeight: window.innerHeight,
    }
  })

  expect(geometry.pageScrollable).toBe(false)
  expect(geometry.timerScrollable).toBe(false)
  expect(geometry.primaryTop).toBeGreaterThan(geometry.taskBottom)
  expect(geometry.primaryBottom).toBeLessThanOrEqual(geometry.viewportHeight)

  await page.reload()
  await expect(page.getByText('Привет, Маша')).toBeVisible()
})

test('timer resumes from the persisted deadline after pause and reload, then records focus statistics at 412 by 915', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 })
  await page.goto('/pomokitty/')
  await page.getByLabel('Как тебя зовут?').fill('Маша')
  await page.getByRole('button', { name: 'Продолжить' }).click()

  await page.getByLabel('Задача').fill('Математика')
  await page.getByRole('button', { name: 'Начать' }).click()
  await expect(page.getByRole('button', { name: 'Пауза' })).toBeVisible()

  await page.getByRole('button', { name: 'Пауза' }).click()
  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeVisible()
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await expect(page.getByRole('button', { name: 'Пауза' })).toBeVisible()

  await page.evaluate(() => {
    const key = 'pomokitty:data:v1'
    const data = JSON.parse(localStorage.getItem(key) ?? '{}')
    if (!data.activeSession) throw new Error('Active timer was not persisted')
    data.activeSession.targetEndsAt = Date.now() + 120_000
    data.activeSession.remainingSeconds = 99_999
    localStorage.setItem(key, JSON.stringify(data))
  })
  await page.reload()

  await expect(page.getByRole('button', { name: 'Пауза' })).toBeVisible()
  await expect(page.locator('.timer-screen__status output')).toHaveText(/01:5[7-9]|02:00/)

  const geometry = await page.locator('.timer-screen').evaluate((timerScreen) => {
    const task = timerScreen.querySelector('input')
    const primaryAction = timerScreen.querySelector('.timer-screen__primary')
    if (!task || !primaryAction) throw new Error('Timer controls are missing')
    const taskBox = task.getBoundingClientRect()
    const primaryBox = primaryAction.getBoundingClientRect()
    return {
      pageScrollable: document.documentElement.scrollHeight > window.innerHeight,
      timerScrollable: timerScreen.scrollHeight > timerScreen.clientHeight,
      taskBottom: taskBox.bottom,
      primaryTop: primaryBox.top,
      primaryBottom: primaryBox.bottom,
      viewportHeight: window.innerHeight,
    }
  })
  expect(geometry.pageScrollable).toBe(false)
  expect(geometry.timerScrollable).toBe(false)
  expect(geometry.primaryTop).toBeGreaterThan(geometry.taskBottom)
  expect(geometry.primaryBottom).toBeLessThanOrEqual(geometry.viewportHeight)

  await page.getByRole('button', { name: 'Завершить этап' }).click()
  await page.getByRole('button', { name: 'Статистика' }).click()
  const todayStats = page.getByTestId('stats-today')
  await expect(todayStats).toContainText(/2[0-4] мин/)
  await expect(todayStats).not.toContainText('25 мин')
  await expect(page.getByRole('list', { name: 'История сессий' })).toContainText('Фокус')
})

test('settings persist sound and language choices, respect reduced motion, and require clear-data confirmation', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/pomokitty/')
  await page.getByLabel('Как тебя зовут?').fill('Маша')
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await page.getByRole('button', { name: 'Начать' }).click()
  await expect(page.locator('.mascot__body')).toHaveCSS('animation-name', 'none')

  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByLabel('Фоновый звук').selectOption('rain')
  await page.getByLabel('Громкость: 50%').fill('70')
  await expect(page.getByLabel('Громкость: 70%')).toHaveValue('70')
  await page.getByLabel('Язык').selectOption('en')

  await page.reload()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.getByLabel('Background sound')).toHaveValue('rain')
  await expect(page.getByLabel('Volume: 70%')).toHaveValue('70')
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear all data' })).toBeVisible()

  await page.getByRole('button', { name: 'Clear all data' }).click()
  await expect(page.getByRole('alert')).toContainText('This deletes all settings and history on this device.')
  await expect(page.getByRole('button', { name: 'Yes, clear data' })).toBeVisible()
  await page.getByRole('button', { name: 'Yes, clear data' }).click()

  await expect(page.getByLabel('Как тебя зовут?')).toBeVisible()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('pomokitty:data:v1'))).toBeNull()
})
