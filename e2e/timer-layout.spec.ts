import { expect, test } from '@playwright/test'

for (const viewport of [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 393, height: 852 },
  { width: 375, height: 667 },
  { width: 412, height: 915 },
]) {
test(`keeps every active timer control and navigation non-overlapping at ${viewport.width}x${viewport.height}`, async ({ page }) => {
  await page.setViewportSize(viewport)
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
  await page.getByRole('button', { name: 'Start' }).click()

  const geometry = await page.locator('.timer-screen').evaluate((timerScreen) => {
    const status = timerScreen.querySelector('.timer-screen__status')
    const primaryAction = timerScreen.querySelector('.timer-screen__primary')
    const reset = timerScreen.querySelector('.timer-screen__reset')
    const navigation = document.querySelector('.bottom-nav')
    if (!status || !primaryAction || !reset || !navigation) throw new Error('Timer controls are missing')

    const statusBox = status.getBoundingClientRect()
    const primaryBox = primaryAction.getBoundingClientRect()
    const resetBox = reset.getBoundingClientRect()
    const navigationBox = navigation.getBoundingClientRect()
    return {
      pageScrollable: document.documentElement.scrollHeight > window.innerHeight,
      timerScrollable: timerScreen.scrollHeight > timerScreen.clientHeight,
      statusBottom: statusBox.bottom,
      primaryTop: primaryBox.top,
      primaryBottom: primaryBox.bottom,
      resetTop: resetBox.top,
      resetBottom: resetBox.bottom,
      navigationTop: navigationBox.top,
      viewportHeight: window.innerHeight,
    }
  })

  expect(geometry.pageScrollable).toBe(false)
  expect(geometry.timerScrollable).toBe(false)
  expect(geometry.primaryTop).toBeGreaterThan(geometry.statusBottom)
  expect(geometry.resetBottom).toBeLessThanOrEqual(geometry.primaryTop)
  expect(geometry.primaryBottom).toBeLessThanOrEqual(geometry.navigationTop)
  expect(geometry.primaryBottom).toBeLessThanOrEqual(geometry.viewportHeight)
})
}
