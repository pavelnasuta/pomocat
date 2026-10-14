import { describe, expect, test } from 'vitest'
import { createStatsShareText } from './shareCard'

describe('createStatsShareText', () => {
  test('includes the child name, statistics, cats, and the app link in Russian', () => {
    expect(createStatsShareText({
      childName: 'Маша',
      todayMinutes: 50,
      weekMinutes: 450,
      cats: 12,
      locale: 'ru',
      appUrl: 'https://pavelnasuta.github.io/pomokitty/',
    })).toBe(
      'Маша: уже 12 котиков 🐾\n\nСегодня: 50 мин фокуса\nЗа неделю: 450 мин\n\npomokitty помогает делать дела короткими спокойными раундами и вовремя отдыхать.\nhttps://pavelnasuta.github.io/pomokitty/',
    )
  })

  test('uses English copy when the application is English', () => {
    expect(createStatsShareText({
      childName: 'Maya',
      todayMinutes: 25,
      weekMinutes: 75,
      cats: 3,
      locale: 'en',
      appUrl: 'https://pavelnasuta.github.io/pomokitty/',
    })).toContain('Maya collected 3 cats')
  })
})
