import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PomodoroController } from '../timer/usePomodoroController'
import { TabletRoutinePanel } from './TabletRoutinePanel'

const controller: PomodoroController = {
  locale: 'ru', animationsEnabled: true, soundEnabled: true, selectedSound: 'forestRain', taskName: '',
  view: { phase: 'focus', remainingMs: 24 * 60_000, totalMs: 25 * 60_000, completedFocusRounds: 1, isFinished: false },
  wakeLockStatus: 'active', audioStatus: 'idle', setTaskName: vi.fn(), toggleSound: vi.fn(), selectSound: vi.fn(),
  start: vi.fn(), pause: vi.fn(), resume: vi.fn(), skip: vi.fn(), finishCurrentPhase: vi.fn(), reset: vi.fn(),
}

test('offers the current sound choices and focus rhythm in the tablet side panel', async () => {
  const user = userEvent.setup()
  render(<TabletRoutinePanel controller={controller} roundsBeforeLongBreak={4} />)

  expect(screen.getByLabelText('Ритм на сегодня')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Дождь по листве' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getAllByTestId('tablet-round')).toHaveLength(4)
  await user.click(screen.getByRole('button', { name: 'Океан без птиц' }))
  expect(controller.selectSound).toHaveBeenCalledWith('ocean')
})
