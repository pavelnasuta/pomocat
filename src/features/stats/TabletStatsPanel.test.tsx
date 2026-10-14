import { render, screen, within } from '@testing-library/react'
import type { SessionHistoryItem } from '../../domain/types'
import { TabletStatsPanel } from './TabletStatsPanel'

const history: SessionHistoryItem[] = [
  { id: 'today', phase: 'focus', durationMinutes: 25, earnedCats: 1, completedAt: '2026-10-11T10:00:00.000Z' },
  { id: 'week-double', phase: 'focus', durationMinutes: 25, earnedCats: 2, completedAt: '2026-10-09T10:00:00.000Z' },
  { id: 'month', phase: 'focus', durationMinutes: 25, earnedCats: 1, completedAt: '2026-10-02T10:00:00.000Z' },
  { id: 'break', phase: 'shortBreak', durationMinutes: 5, completedAt: '2026-10-11T09:00:00.000Z' },
]

test('shows local day, week and month progress with one cat per weekly reward', () => {
  render(<TabletStatsPanel history={history} childName="Маша" now={new Date('2026-10-11T12:00:00.000Z')} />)

  expect(within(screen.getByTestId('tablet-stats-today')).getByText('25 мин')).toBeInTheDocument()
  expect(within(screen.getByTestId('tablet-stats-today')).getByText('Котиков: 1')).toBeInTheDocument()
  expect(within(screen.getByTestId('tablet-stats-week')).getAllByTestId('tablet-week-cat')).toHaveLength(3)
  expect(within(screen.getByTestId('tablet-stats-month')).getByText('75 мин')).toBeInTheDocument()
  expect(within(screen.getByTestId('tablet-stats-month')).getByText('Котиков: 4')).toBeInTheDocument()
})

test('keeps the cats sharing action in the persistent tablet panel', () => {
  render(<TabletStatsPanel history={history} childName="Маша" now={new Date('2026-10-11T12:00:00.000Z')} />)

  expect(screen.getByRole('button', { name: 'Поделиться котиками' })).toBeInTheDocument()
})
