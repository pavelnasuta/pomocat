import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PomodoroController } from './usePomodoroController'
import { TimerScreen } from './TimerScreen'

function controllerFor(
  phase: PomodoroController['view']['phase'] = 'focus',
  locale: PomodoroController['locale'] = 'ru',
): PomodoroController {
  return {
    locale,
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
    audioStatus: 'idle',
    setTaskName: vi.fn(),
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    finishCurrentPhase: vi.fn(),
    reset: vi.fn(),
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

test('uses distinct visual poses for focus, pause, and break', () => {
  const { rerender } = render(<TimerScreen controller={controllerFor('focus')} />)
  expect(screen.getByTestId('mascot')).toHaveAttribute('data-pose', 'work')

  rerender(<TimerScreen controller={controllerFor('paused')} />)
  expect(screen.getByTestId('mascot')).toHaveAttribute('data-pose', 'pause')

  rerender(<TimerScreen controller={controllerFor('shortBreak')} />)
  expect(screen.getByTestId('mascot')).toHaveAttribute('data-pose', 'stretch')
  expect(screen.getByTestId('mascot')).toHaveAttribute('data-animated', 'false')
})

test('renders English paused controls and forwards task edits', async () => {
  const controller = controllerFor('paused', 'en')
  const user = userEvent.setup()

  render(<TimerScreen controller={controller} />)

  const task = screen.getByLabelText('Task')
  fireEvent.change(task, { target: { value: 'Science' } })
  await user.click(screen.getByRole('button', { name: 'Resume' }))

  expect(controller.setTaskName).toHaveBeenLastCalledWith('Science')
  expect(controller.resume).toHaveBeenCalledOnce()
})

test('renders the English finish control for an active phase', async () => {
  const controller = controllerFor('focus', 'en')
  const user = userEvent.setup()

  render(<TimerScreen controller={controller} />)
  await user.click(screen.getByRole('button', { name: 'Finish phase' }))

  expect(controller.finishCurrentPhase).toHaveBeenCalledOnce()
})

test('shows a short localized audio status while keeping timer controls available', () => {
  const controller = controllerFor('focus', 'en')
  controller.audioStatus = 'blocked'

  render(<TimerScreen controller={controller} />)

  expect(screen.getByText('Could not play sound')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Pause' })).toBeEnabled()
})
