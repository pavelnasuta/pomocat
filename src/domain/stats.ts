import type { SessionHistoryItem } from './types'

function startOfDay(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

function focusMinutes(item: SessionHistoryItem): number {
  return item.actualDurationMs === undefined
    ? item.durationMinutes
    : item.actualDurationMs / (60 * 1_000)
}

function sumCompletedWithin(
  history: SessionHistoryItem[],
  start: Date,
  end: Date,
): number {
  return history.reduce((total, item) => {
    const completedAt = new Date(item.completedAt)
    return item.phase === 'focus' && completedAt >= start && completedAt < end
      ? total + focusMinutes(item)
      : total
  }, 0)
}

function countCompletedWithin(
  history: SessionHistoryItem[],
  start: Date,
  end: Date,
): number {
  return history.filter((item) => {
    const completedAt = new Date(item.completedAt)
    return item.phase === 'focus' && completedAt >= start && completedAt < end
  }).length
}

export function getAllSessionCount(history: SessionHistoryItem[]): number {
  return history.filter((item) => item.phase === 'focus').length
}

export function getWeeklySessionCount(history: SessionHistoryItem[], now: Date): number {
  const start = startOfDay(now)
  const daysSinceMonday = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - daysSinceMonday)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return countCompletedWithin(history, start, end)
}

export function getMonthlySessionCount(history: SessionHistoryItem[], now: Date): number {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return countCompletedWithin(history, start, end)
}

export function getDailyMinutes(history: SessionHistoryItem[], now: Date): number {
  const start = startOfDay(now)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return sumCompletedWithin(history, start, end)
}

export function getWeeklyMinutes(history: SessionHistoryItem[], now: Date): number {
  const start = startOfDay(now)
  const daysSinceMonday = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - daysSinceMonday)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  return sumCompletedWithin(history, start, end)
}
