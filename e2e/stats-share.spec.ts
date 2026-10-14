import { expect, test } from '@playwright/test'

test('shares a PNG cat card with the child name, statistics, and app link', async ({ page }) => {
  await page.addInitScript(() => {
    const now = new Date().toISOString()
    localStorage.setItem('pomokitty:data:v1', JSON.stringify({
      version: 1,
      settings: {
        childName: 'Маша', locale: 'ru', focusMinutes: 25, shortBreakMinutes: 5,
        longBreakMinutes: 15, roundsBeforeLongBreak: 4, autoStartNext: false,
        animationsEnabled: true, notificationsEnabled: false, keepScreenAwake: false,
        theme: 'seaGlass', selectedSound: 'forestRain', soundEnabled: true, soundVolume: 0.5,
      },
      history: [
        { id: 'one', phase: 'focus', durationMinutes: 25, completedAt: now, earnedCats: 1 },
        { id: 'two', phase: 'focus', durationMinutes: 25, completedAt: now, earnedCats: 1 },
      ],
    }))

    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        const file = data.files?.[0]
        document.documentElement.dataset.shareType = file?.type ?? ''
        document.documentElement.dataset.shareSize = String(file?.size ?? 0)
        document.documentElement.dataset.shareText = data.text ?? ''
      },
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Статистика' }).click()
  await page.getByRole('button', { name: 'Поделиться котиками' }).click()

  await expect(page.locator('html')).toHaveAttribute('data-share-type', 'image/png')
  await expect(page.locator('html')).toHaveAttribute('data-share-size', /[1-9]\d*/)
  await expect(page.locator('html')).toHaveAttribute('data-share-text', /Маша: уже 2 котиков/)
  await expect(page.locator('html')).toHaveAttribute('data-share-text', /https:\/\/pavelnasuta\.github\.io\/pomokitty\//)
  await expect(page.locator('.stats-screen__share [role="status"]')).toContainText('Карточка готова')
})
