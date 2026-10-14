import { expect, test } from '@playwright/test'

test('keeps mascot space and timer controls fixed across all timer modes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.addInitScript(() => {
    localStorage.setItem('pomokitty:data:v1', JSON.stringify({
      version: 1,
      settings: {
        childName: 'Masha', locale: 'en', focusMinutes: 25, shortBreakMinutes: 5,
        longBreakMinutes: 15, roundsBeforeLongBreak: 4, autoStartNext: false,
        animationsEnabled: false, notificationsEnabled: false, keepScreenAwake: false,
        selectedSound: 'none', soundVolume: 0.5,
      },
      history: [],
    }))
  })

  await page.goto('/app/')
  await page.getByRole('button', { name: 'Start' }).click()

  const getLayout = () => page.evaluate(() => {
    const mascot = document.querySelector('[data-testid="mascot"]')
    const controls = document.querySelector('.timer-screen__controls')
    if (!mascot || !controls) throw new Error('Timer layout is missing')
    const mascotBox = mascot.getBoundingClientRect()
    const controlsBox = controls.getBoundingClientRect()
    return { mascotHeight: mascotBox.height, controlsTop: controlsBox.top }
  })

  const layouts = [await getLayout()]
  for (let transition = 0; transition < 7; transition += 1) {
    await page.getByRole('button', { name: 'Skip' }).click()
    layouts.push(await getLayout())
  }
  await page.getByRole('button', { name: 'Pause' }).click()
  layouts.push(await getLayout())

  for (const layout of layouts) {
    expect(layout.mascotHeight).toBe(layouts[0].mascotHeight)
    expect(layout.controlsTop).toBe(layouts[0].controlsTop)
  }
})
