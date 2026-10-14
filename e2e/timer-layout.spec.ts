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

  await page.goto('/app/')
  await page.getByRole('button', { name: 'Start' }).click()

  const geometry = await page.locator('.timer-screen').evaluate((timerScreen) => {
    const status = timerScreen.querySelector('.timer-screen__status')
    const primaryAction = timerScreen.querySelector('.timer-screen__primary')
    const secondaryActions = timerScreen.querySelector('.timer-screen__secondary-actions')
    const skip = timerScreen.querySelector('.timer-screen__skip')
    const reset = timerScreen.querySelector('.timer-screen__reset')
    const navigation = document.querySelector('.bottom-nav')
    if (!status || !primaryAction || !secondaryActions || !skip || !reset || !navigation) throw new Error('Timer controls are missing')

    const statusBox = status.getBoundingClientRect()
    const primaryBox = primaryAction.getBoundingClientRect()
    const secondaryBox = secondaryActions.getBoundingClientRect()
    const skipBox = skip.getBoundingClientRect()
    const resetBox = reset.getBoundingClientRect()
    const navigationBox = navigation.getBoundingClientRect()
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
      navigationTop: navigationBox.top,
      viewportHeight: window.innerHeight,
    }
  })

  expect(geometry.pageScrollable).toBe(false)
  expect(geometry.timerScrollable).toBe(false)
  expect(geometry.primaryTop).toBeGreaterThan(geometry.statusBottom)
  expect(geometry.secondaryTop).toBeGreaterThanOrEqual(geometry.primaryBottom)
  expect(geometry.secondaryBottom).toBeLessThanOrEqual(geometry.navigationTop)
  expect(geometry.secondaryBottom).toBeLessThanOrEqual(geometry.viewportHeight)
  expect(geometry.primaryWidth).toBe(geometry.secondaryWidth)
  expect(geometry.skipTop).toBe(geometry.resetTop)
})
}
