import { getAllSessionCount, getDailyMinutes, getDailySessionCount, getMonthlyMinutes, getWeeklyMinutes } from './stats'
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

test('excludes break entries from daily and weekly focus totals', () => {
  const mixedHistory: SessionHistoryItem[] = [
    ...history,
    {
      id: 'short-break',
      phase: 'shortBreak',
      durationMinutes: 5,
      completedAt: '2026-10-11T10:00:00.000Z',
    },
    {
      id: 'long-break',
      phase: 'longBreak',
      durationMinutes: 15,
      completedAt: '2026-10-11T11:00:00.000Z',
    },
  ]

  const now = new Date('2026-10-11T12:00:00.000Z')
  expect(getDailyMinutes(mixedHistory, now)).toBe(25)
  expect(getWeeklyMinutes(mixedHistory, now)).toBe(25)
})

test('uses actual elapsed focus duration when it is available', () => {
  const earlyFinish: SessionHistoryItem[] = [
    {
      id: 'early-finish',
      phase: 'focus',
      durationMinutes: 25,
      actualDurationMs: 5 * 60 * 1_000,
      plannedDurationMs: 25 * 60 * 1_000,
      completedAt: '2026-10-11T10:00:00.000Z',
    },
  ]

  expect(getDailyMinutes(earlyFinish, new Date('2026-10-11T12:00:00.000Z'))).toBe(5)
})

test('counts daily earned cats and monthly focus minutes for a compact progress summary', () => {
  const summaryHistory: SessionHistoryItem[] = [
    ...history,
    { id: 'today-double', phase: 'focus', durationMinutes: 25, earnedCats: 2, completedAt: '2026-10-11T10:00:00.000Z' },
    { id: 'month', phase: 'focus', durationMinutes: 30, earnedCats: 1, completedAt: '2026-10-02T10:00:00.000Z' },
    { id: 'last-month', phase: 'focus', durationMinutes: 40, earnedCats: 2, completedAt: '2026-09-30T10:00:00.000Z' },
  ]
  const now = new Date('2026-10-11T12:00:00.000Z')

  expect(getDailySessionCount(summaryHistory, now)).toBe(3)
  expect(getMonthlyMinutes(summaryHistory, now)).toBe(80)
})

test('counts only awarded cats while retaining all accumulated focus minutes', () => {
  const partialFocus: SessionHistoryItem[] = [
    {
      id: 'partial', phase: 'focus', durationMinutes: 10, actualDurationMs: 10 * 60 * 1_000,
      plannedDurationMs: 25 * 60 * 1_000, earnedCats: 0, completedAt: '2026-10-11T09:00:00.000Z',
    },
    {
      id: 'threshold', phase: 'focus', durationMinutes: 15, actualDurationMs: 15 * 60 * 1_000,
      plannedDurationMs: 25 * 60 * 1_000, earnedCats: 1, completedAt: '2026-10-11T10:00:00.000Z',
    },
  ]

  expect(getDailyMinutes(partialFocus, new Date('2026-10-11T12:00:00.000Z'))).toBe(25)
  expect(getAllSessionCount(partialFocus)).toBe(1)
})
