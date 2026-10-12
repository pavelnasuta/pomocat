import { render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import type { SessionHistoryItem } from '../../domain/types'
import { StatsScreen } from './StatsScreen'

const history: SessionHistoryItem[] = [
  { id: 'today', phase: 'focus', durationMinutes: 25, completedAt: '2026-10-11T10:00:00.000Z' },
  { id: 'yesterday', phase: 'focus', durationMinutes: 25, completedAt: '2026-10-10T10:00:00.000Z' },
  { id: 'monday', phase: 'focus', durationMinutes: 25, completedAt: '2026-10-05T10:00:00.000Z' },
  { id: 'september', phase: 'focus', durationMinutes: 25, completedAt: '2026-09-30T10:00:00.000Z' },
  { id: 'break', phase: 'shortBreak', durationMinutes: 5, completedAt: '2026-10-11T09:00:00.000Z' },
]

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-11T12:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

test('shows daily and weekly completed focus minutes without counting breaks', () => {
  render(<StatsScreen history={history} />)

  expect(within(screen.getByTestId('stats-today')).getByText('25 мин')).toBeInTheDocument()
  expect(within(screen.getByTestId('stats-week')).getByText('75 мин')).toBeInTheDocument()
})

test('shows completed focus session counts as full-width cat tiles', () => {
  render(<StatsScreen history={history} />)

  const tiles = screen.getAllByTestId(/stats-sessions-/)
  expect(tiles.map((tile) => tile.dataset.testid)).toEqual([
    'stats-sessions-week',
    'stats-sessions-month',
    'stats-sessions-all',
  ])
  expect(within(screen.getByTestId('stats-sessions-all')).getByText('4')).toBeInTheDocument()
  expect(within(screen.getByTestId('stats-sessions-week')).getByText('3')).toBeInTheDocument()
  expect(within(screen.getByTestId('stats-sessions-month')).getByText('3')).toBeInTheDocument()
  expect(within(screen.getByTestId('stats-sessions-all')).getAllByTestId('stats-session-cat')).toHaveLength(4)
  expect(within(screen.getByTestId('stats-sessions-week')).getAllByTestId('stats-session-cat')).toHaveLength(3)
  expect(within(screen.getByTestId('stats-sessions-month')).getAllByTestId('stats-session-cat')).toHaveLength(3)
  expect(screen.queryByRole('list', { name: 'История сессий' })).not.toBeInTheDocument()
})

test('uses the current app locale for English statistics', () => {
  render(<StatsScreen history={history} locale="en" />)

  expect(screen.getByRole('heading', { name: 'Completed sessions' })).toBeInTheDocument()
  expect(within(screen.getByTestId('stats-week')).getByText('75 min')).toBeInTheDocument()
})
