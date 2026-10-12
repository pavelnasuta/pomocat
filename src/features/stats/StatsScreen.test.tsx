import { render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import type { SessionHistoryItem } from '../../domain/types'
import { StatsScreen } from './StatsScreen'

const history: SessionHistoryItem[] = [
  { id: 'today', phase: 'focus', durationMinutes: 25, completedAt: '2026-10-11T10:00:00.000Z' },
  { id: 'yesterday', phase: 'focus', durationMinutes: 25, completedAt: '2026-10-10T10:00:00.000Z' },
  { id: 'monday', phase: 'focus', durationMinutes: 25, completedAt: '2026-10-05T10:00:00.000Z' },
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

test('shows local session history in reverse completion order', () => {
  render(<StatsScreen history={history} />)

  const entries = within(screen.getByRole('list', { name: 'История сессий' })).getAllByRole('listitem')
  expect(entries).toHaveLength(4)
  expect(entries[0]).toHaveTextContent('Фокус')
  expect(entries[0]).toHaveTextContent('25 мин')
  expect(entries[1]).toHaveTextContent('Короткий перерыв')
})

test('shows a localized task title only for history entries that have one', () => {
  render(
    <StatsScreen
      history={[
        { id: 'titled', phase: 'focus', durationMinutes: 25, completedAt: '2026-10-11T11:00:00.000Z', taskName: 'Математика' },
        ...history,
      ]}
    />,
  )

  const entries = within(screen.getByRole('list', { name: 'История сессий' })).getAllByRole('listitem')
  expect(entries[0]).toHaveTextContent('Задача: Математика')
  expect(entries[1]).not.toHaveTextContent('Задача')
})

test('uses the current app locale for English statistics', () => {
  render(<StatsScreen history={history} locale="en" />)

  expect(screen.getByRole('heading', { name: 'Focus history' })).toBeInTheDocument()
  expect(within(screen.getByTestId('stats-week')).getByText('75 min')).toBeInTheDocument()
})
