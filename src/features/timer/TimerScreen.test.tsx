import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PomodoroController } from './usePomodoroController'
import { TimerScreen } from './TimerScreen'

function controllerFor(phase: PomodoroController['view']['phase'] = 'focus'): PomodoroController {
  return {
    locale: 'ru',
    animationsEnabled: true,
    view: {
      phase,
      remainingMs: 24 * 60 * 1_000,
      totalMs: 25 * 60 * 1_000,
      completedFocusRounds: 0,
      isFinished: false,
    },
    taskName: 'Math',
    wakeLockStatus: 'active',
    setTaskName: vi.fn(),
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    finishCurrentPhase: vi.fn(),
  }
}

test('renders the active focus timer and pauses it from the primary action', async () => {
  const controller = controllerFor()
  const user = userEvent.setup()

  render(<TimerScreen controller={controller} />)

  expect(screen.getByText('24:00')).toBeInTheDocument()
  expect(screen.getByDisplayValue('Math')).toBeInTheDocument()
  expect(screen.getByTestId('mascot')).toHaveAttribute('data-animated', 'true')
  await user.click(screen.getByRole('button', { name: 'Пауза' }))

  expect(controller.pause).toHaveBeenCalledTimes(1)
})

test('keeps the mascot calm during an active break', () => {
  render(<TimerScreen controller={controllerFor('shortBreak')} />)

  expect(screen.getByTestId('mascot')).toHaveAttribute('data-animated', 'false')
})
