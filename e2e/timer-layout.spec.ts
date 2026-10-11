import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 375, height: 667 } })

test('keeps the timer task and primary action visible in separate mobile areas without page scrolling', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pomokitty:data:v1',
      JSON.stringify({
        version: 1,
        settings: {
          childName: 'Masha',
          locale: 'en',
          focusMinutes: 25,
          shortBreakMinutes: 5,
          longBreakMinutes: 15,
          roundsBeforeLongBreak: 4,
          autoStartNext: false,
          animationsEnabled: true,
          notificationsEnabled: false,
          keepScreenAwake: false,
          selectedSound: 'none',
          soundVolume: 0.5,
        },
        history: [],
      }),
    )
  })

  await page.goto('/')

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
