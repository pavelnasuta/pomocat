import { expect, test } from '@playwright/test'

interface PomokittyTestWindow {
  advancePomokittyClock(milliseconds: number): void
  pomokittyResources: { plays: number, wakeRequests: number, wakeReleases: number }
}

const requiredDiagnosticViewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 393, height: 852 },
] as const

async function completeOnboarding(page: import('@playwright/test').Page, name = 'Маша') {
  await page.getByLabel('Как тебя зовут?').fill(name)
  await page.getByRole('button', { name: 'Дальше' }).click()
  await page.getByRole('button', { name: 'Понятно' }).click()
  await page.getByRole('button', { name: 'Начать первую сессию' }).click()
}

test('keeps every onboarding screen inside a 320 by 568 viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/pomokitty/')

  async function expectViewportFit() {
    const geometry = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }))
    expect(geometry.width).toBe(geometry.viewportWidth)
    expect(geometry.height).toBeLessThanOrEqual(geometry.viewportHeight)
  }

  await expectViewportFit()
  await page.getByLabel('Как тебя зовут?').fill('Маша')
  await page.getByRole('button', { name: 'Дальше' }).click()
  await expectViewportFit()
  await page.getByRole('button', { name: 'Понятно' }).click()
  await expectViewportFit()
})

for (const viewport of requiredDiagnosticViewports) {
  test(`keeps the timer unscrolled and non-overlapping at ${viewport.width} by ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/pomokitty/')
    await completeOnboarding(page)

    const geometry = await page.locator('.timer-screen').evaluate((timerScreen) => {
      const status = timerScreen.querySelector('.timer-screen__status')
      const primaryAction = timerScreen.querySelector('.timer-screen__primary')
      if (!status || !primaryAction) throw new Error('Timer controls are missing')

      const statusBox = status.getBoundingClientRect()
      const primaryBox = primaryAction.getBoundingClientRect()
      return {
        pageScrollable: document.documentElement.scrollHeight > window.innerHeight,
        timerScrollable: timerScreen.scrollHeight > timerScreen.clientHeight,
        statusBottom: statusBox.bottom,
        primaryTop: primaryBox.top,
        primaryBottom: primaryBox.bottom,
        viewportHeight: window.innerHeight,
      }
    })

    expect(geometry.pageScrollable).toBe(false)
    expect(geometry.timerScrollable).toBe(false)
    expect(geometry.primaryTop).toBeGreaterThan(geometry.statusBottom)
    expect(geometry.primaryBottom).toBeLessThanOrEqual(geometry.viewportHeight)
  })
}

test('first mobile visit stores the Russian child name and keeps the timer inside 375 by 667', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/pomokitty/')

  await completeOnboarding(page)

  await expect(page.getByRole('main', { name: 'pomokitty' })).toBeVisible()
  await expect(page.getByText('Привет, Маша')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Начать' })).toBeVisible()

  const geometry = await page.locator('.timer-screen').evaluate((timerScreen) => {
    const status = timerScreen.querySelector('.timer-screen__status')
    const primaryAction = timerScreen.querySelector('.timer-screen__primary')
    if (!status || !primaryAction) throw new Error('Timer controls are missing')

    const statusBox = status.getBoundingClientRect()
    const primaryBox = primaryAction.getBoundingClientRect()
    return {
      pageScrollable: document.documentElement.scrollHeight > window.innerHeight,
      timerScrollable: timerScreen.scrollHeight > timerScreen.clientHeight,
      statusBottom: statusBox.bottom,
      primaryTop: primaryBox.top,
      primaryBottom: primaryBox.bottom,
      viewportHeight: window.innerHeight,
    }
  })

  expect(geometry.pageScrollable).toBe(false)
  expect(geometry.timerScrollable).toBe(false)
  expect(geometry.primaryTop).toBeGreaterThan(geometry.statusBottom)
  expect(geometry.primaryBottom).toBeLessThanOrEqual(geometry.viewportHeight)

  await page.reload()
  await expect(page.getByText('Привет, Маша')).toBeVisible()
})

test('timer resumes from the persisted deadline after pause and reload, then reset returns to the start at 412 by 915', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 })
  await page.goto('/pomokitty/')
  await completeOnboarding(page)

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
    data.activeSession.totalMs = 25 * 60 * 1_000
    data.activeSession.remainingSeconds = 120
    localStorage.setItem(key, JSON.stringify(data))
  })
  await page.reload()

  await expect(page.getByRole('button', { name: 'Пауза' })).toBeVisible()
  await expect(page.locator('.timer-screen__status output')).toHaveText(/01:5[7-9]|02:00/)

  const geometry = await page.locator('.timer-screen').evaluate((timerScreen) => {
    const status = timerScreen.querySelector('.timer-screen__status')
    const primaryAction = timerScreen.querySelector('.timer-screen__primary')
    const secondaryActions = timerScreen.querySelector('.timer-screen__secondary-actions')
    const skip = timerScreen.querySelector('.timer-screen__skip')
    const reset = timerScreen.querySelector('.timer-screen__reset')
    if (!status || !primaryAction || !secondaryActions || !skip || !reset) throw new Error('Timer controls are missing')
    const statusBox = status.getBoundingClientRect()
    const primaryBox = primaryAction.getBoundingClientRect()
    const secondaryBox = secondaryActions.getBoundingClientRect()
    const skipBox = skip.getBoundingClientRect()
    const resetBox = reset.getBoundingClientRect()
    return {
      pageScrollable: document.documentElement.scrollHeight > window.innerHeight,
      timerScrollable: timerScreen.scrollHeight > timerScreen.clientHeight,
      statusBottom: statusBox.bottom,
      primaryTop: primaryBox.top,
      primaryBottom: primaryBox.bottom,
      primaryWidth: primaryBox.width,
      secondaryTop: secondaryBox.top,
      secondaryBottom: secondaryBox.bottom,
      secondaryWidth: secondaryBox.width,
      skipTop: skipBox.top,
      resetTop: resetBox.top,
      viewportHeight: window.innerHeight,
    }
  })
  expect(geometry.pageScrollable).toBe(false)
  expect(geometry.timerScrollable).toBe(false)
  expect(geometry.primaryTop).toBeGreaterThan(geometry.statusBottom)
  expect(geometry.secondaryTop).toBeGreaterThanOrEqual(geometry.primaryBottom)
  expect(geometry.secondaryBottom).toBeLessThanOrEqual(geometry.viewportHeight)
  expect(geometry.primaryWidth).toBe(geometry.secondaryWidth)
  expect(geometry.skipTop).toBe(geometry.resetTop)

  await page.getByRole('button', { name: 'Я всё сделал' }).click()
  await expect(page.getByRole('button', { name: 'Начать' })).toBeVisible()
  await expect(page.getByLabel('Что делаем?')).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('pomokitty:data:v1') ?? '{}').activeSession)).toBeUndefined()
})

test('settings persist sound and language choices, respect reduced motion, and require clear-data confirmation', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/pomokitty/')
  await completeOnboarding(page)
  await page.getByRole('button', { name: 'Начать' }).click()
  await expect(page.locator('.mascot__image')).toHaveCSS('animation-name', 'none')

  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByLabel('Фоновый звук').selectOption('forestRain')
  await page.getByLabel('Громкость: 50%').fill('70')
  await expect(page.getByLabel('Громкость: 70%')).toHaveValue('70')
  await page.getByLabel('Язык').selectOption('en')

  await page.reload()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.getByLabel('Background sound')).toHaveValue('forestRain')
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

test('honors manual and automatic expiry transitions', async ({ page }) => {
  await page.goto('/pomokitty/')
  await completeOnboarding(page)
  await page.getByRole('button', { name: 'Начать' }).click()
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('pomokitty:data:v1') ?? '{}')
    data.activeSession.targetEndsAt = Date.now() - 1
    localStorage.setItem('pomokitty:data:v1', JSON.stringify(data))
  })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeVisible()
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await expect(page.getByRole('button', { name: 'Пауза' })).toBeVisible()
  await expect(page.locator('.timer-screen__status output')).toHaveText('05:00')

  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await completeOnboarding(page)
  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByLabel('Начинать следующий этап автоматически').check()
  await page.getByRole('button', { name: 'Таймер' }).click()
  await page.getByRole('button', { name: 'Начать' }).click()
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('pomokitty:data:v1') ?? '{}')
    data.activeSession.targetEndsAt = Date.now() - 1
    localStorage.setItem('pomokitty:data:v1', JSON.stringify(data))
  })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Пауза' })).toBeVisible()
  await expect(page.locator('.timer-screen__status output')).toHaveText('05:00')
})

test('plays a completion chime before restoring selected audio and focus wake lock across automatic transitions', async ({ page }) => {
  await page.addInitScript(() => {
    let now = 1_000_000
    const resources = { plays: 0, wakeRequests: 0, wakeReleases: 0 }
    Date.now = () => now
    Object.defineProperty(window, 'advancePomokittyClock', {
      configurable: true,
      value: (milliseconds: number) => { now += milliseconds },
    })
    Object.defineProperty(window, 'pomokittyResources', { configurable: true, value: resources })

    class TestAudio {
      loop = false
      volume = 1
      currentTime = 0
      play() { resources.plays += 1; return Promise.resolve() }
      pause() {}
    }
    Object.defineProperty(window, 'Audio', { configurable: true, value: TestAudio })
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: () => {
          resources.wakeRequests += 1
          return Promise.resolve({
            addEventListener() {},
            release: () => { resources.wakeReleases += 1; return Promise.resolve() },
          })
        },
      },
    })
  })
  await page.goto('/pomokitty/')
  await completeOnboarding(page)
  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByLabel('Фокус, минуты').fill('1')
  await page.getByLabel('Короткий перерыв, минуты').fill('1')
  await page.getByLabel('Начинать следующий этап автоматически').check()
  await page.getByLabel('Фоновый звук').selectOption('forestRain')
  await page.getByLabel('Не выключать экран во время фокуса').check()
  await page.getByRole('button', { name: 'Таймер' }).click()
  await page.getByRole('button', { name: 'Начать' }).click()

  await expect.poll(() => page.evaluate(() => (window as unknown as PomokittyTestWindow).pomokittyResources)).toEqual({ plays: 1, wakeRequests: 1, wakeReleases: 0 })
  await page.evaluate(() => (window as unknown as PomokittyTestWindow).advancePomokittyClock(60_000))
  await expect(page.getByTestId('mascot')).toHaveAttribute('data-pose', 'stretch')
  await expect.poll(() => page.evaluate(() => (window as unknown as PomokittyTestWindow).pomokittyResources)).toEqual({ plays: 3, wakeRequests: 1, wakeReleases: 1 })

  await page.evaluate(() => (window as unknown as PomokittyTestWindow).advancePomokittyClock(60_000))
  await expect(page.getByTestId('mascot')).toHaveAttribute('data-pose', 'work')
  await expect.poll(() => page.evaluate(() => (window as unknown as PomokittyTestWindow).pomokittyResources)).toEqual({ plays: 5, wakeRequests: 2, wakeReleases: 1 })
})

test('requests notification permission only from settings and sends one completion notification', async ({ page }) => {
  await page.addInitScript(() => {
    let now = 1_000_000
    Date.now = () => now
    Object.defineProperty(window, 'advancePomokittyClock', {
      configurable: true,
      value: (milliseconds: number) => { now += milliseconds },
    })

    class TestNotification {
      static permission = 'default'
      static requestPermission = async () => {
        TestNotification.permission = 'granted'
        return 'granted' as NotificationPermission
      }
      constructor(title: string, options: NotificationOptions) {
        ;(window as Window & { notices?: unknown[] }).notices ??= []
        ;(window as Window & { notices: unknown[] }).notices.push({ title, options })
      }
    }
    Object.defineProperty(window, 'Notification', { configurable: true, value: TestNotification })
  })
  await page.goto('/pomokitty/')
  await completeOnboarding(page)
  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByLabel('Показывать уведомления').check()
  await page.getByRole('button', { name: 'Таймер' }).click()
  await page.getByRole('button', { name: 'Начать' }).click()
  await page.evaluate(() => (window as unknown as PomokittyTestWindow).advancePomokittyClock(25 * 60_000))
  await expect.poll(() => page.evaluate(() => (window as Window & { notices?: unknown[] }).notices?.length ?? 0)).toBe(1)
})

test('continues with a localized unsaved-data state when browser storage rejects writes', async ({ page }) => {
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = function(key: string, value: string) {
      if (key === 'pomokitty:data:v1') throw new DOMException('blocked')
      return originalSetItem.call(this, key, value)
    }
  })
  await page.goto('/pomokitty/')
  await completeOnboarding(page)
  await expect(page.getByRole('main', { name: 'pomokitty' })).toBeVisible()
  await expect(page.getByText('Не удалось сохранить изменения на этом устройстве.', { exact: true })).toBeVisible()
})

test('reconciles live audio and wake lock settings and safely resets malformed persistence', async ({ page }) => {
  await page.addInitScript(() => {
    class TestAudio {
      static calls: Array<Record<string, unknown>> = []
      loop = false
      volume = 1
      currentTime = 0
      constructor(public readonly src?: string) { TestAudio.calls.push({ type: 'new', src }) }
      play() { TestAudio.calls.push({ type: 'play', src: this.src, volume: this.volume }); return Promise.resolve() }
      pause() { TestAudio.calls.push({ type: 'pause', src: this.src }); }
    }
    Object.defineProperty(window, 'Audio', { configurable: true, value: TestAudio })
    ;(window as Window & { audioCalls?: unknown[] }).audioCalls = TestAudio.calls
    const wakeLock = { request: () => Promise.resolve({ addEventListener() {}, release: () => Promise.resolve() }) }
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: wakeLock })
  })
  await page.goto('/pomokitty/')
  await completeOnboarding(page)
  await page.getByRole('button', { name: 'Начать' }).click()
  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByLabel('Фоновый звук').selectOption('forestRain')
  await page.getByLabel('Громкость: 50%').fill('70')
  await page.getByLabel('Не выключать экран во время фокуса').check()
  await expect.poll(() => page.evaluate(() => (window as Window & { audioCalls: unknown[] }).audioCalls.length)).toBeGreaterThan(1)
  await page.getByRole('button', { name: 'Таймер' }).click()
  await page.getByRole('button', { name: 'Выключить фоновый звук' }).click()
  await page.getByRole('button', { name: 'Настройки' }).click()
  await page.getByLabel('Не выключать экран во время фокуса').uncheck()

  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('pomokitty:data:v1') ?? '{}')
    data.activeSession.targetEndsAt = 'malformed'
    localStorage.setItem('pomokitty:data:v1', JSON.stringify(data))
  })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Начать' })).toBeVisible()
})
