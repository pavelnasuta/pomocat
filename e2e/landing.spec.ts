import { expect, test } from '@playwright/test'

test('introduces pomokitty to parents at the Pages root and opens the app route', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /Начинать дело проще/ })).toBeVisible()
  await expect(page.getByText('Личное остаётся личным')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Установите pomokitty как приложение' })).toBeVisible()
  await expect(page.getByText('iPhone или iPad')).toBeVisible()
  await expect(page.getByText('Android')).toBeVisible()
  await expect(page.locator('img[alt="Котик pomokitty"]')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(await page.evaluate(() => innerWidth))

  await page.getByRole('link', { name: 'Открыть приложение' }).click()
  await expect(page).toHaveURL(/\/app\/$/)
  await expect(page.getByRole('heading', { name: 'Привет! Я pomokitty' })).toBeVisible()
})
