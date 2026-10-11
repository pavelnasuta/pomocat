import { getDailyMinutes, getWeeklyMinutes } from './stats'
import type { SessionHistoryItem } from './types'

const history: SessionHistoryItem[] = [
  {
    id: 'today',
    phase: 'focus',
    durationMinutes: 25,
    completedAt: '2026-10-11T09:00:00.000Z',
  },
]

test('sums completed minutes for the current day', () => {
  expect(getDailyMinutes(history, new Date('2026-10-11T12:00:00.000Z'))).toBe(25)
})

test('sums completed minutes for the current Monday-to-Sunday week', () => {
  expect(getWeeklyMinutes(history, new Date('2026-10-11T12:00:00.000Z'))).toBe(25)
})

test('excludes history outside the current day', () => {
  const mixedHistory = [
    ...history,
    {
      id: 'yesterday',
      phase: 'focus' as const,
      durationMinutes: 15,
      completedAt: '2026-10-10T23:00:00.000Z',
    },
  ]

  expect(getDailyMinutes(mixedHistory, new Date('2026-10-11T12:00:00.000Z'))).toBe(25)
})

test('excludes the following Monday from the current week', () => {
  const mixedHistory = [
    ...history,
    {
      id: 'next-week',
      phase: 'focus' as const,
      durationMinutes: 15,
      completedAt: '2026-10-12T09:00:00.000Z',
    },
  ]

  expect(getWeeklyMinutes(mixedHistory, new Date('2026-10-11T12:00:00.000Z'))).toBe(25)
})
