import type { SessionHistoryItem } from './types'

function startOfDay(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

function sumCompletedWithin(
  history: SessionHistoryItem[],
  start: Date,
  end: Date,
): number {
  return history.reduce((total, item) => {
    const completedAt = new Date(item.completedAt)
    return item.phase === 'focus' && completedAt >= start && completedAt < end
      ? total + item.durationMinutes
      : total
  }, 0)
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
