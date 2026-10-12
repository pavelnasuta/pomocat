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
  expect(screen.getByText('Время работать')).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Таймер' })).not.toBeInTheDocument()
  expect(screen.queryByText('Фокус')).not.toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Прогресс этапа' })).toHaveAttribute('aria-valuenow', '4')
  expect(screen.getByLabelText('Что делаем?')).toHaveDisplayValue('Math')
  expect(screen.getByTestId('mascot')).toHaveAttribute('data-pose', 'work')
  expect(screen.getByRole('button', { name: 'Пауза' })).toContainElement(document.querySelector('.lucide-pause'))
  await user.click(screen.getByRole('button', { name: 'Пауза' }))

  expect(controller.pause).toHaveBeenCalledTimes(1)
})

test('uses the mascot collection across timer phases', () => {
  const { rerender } = render(<TimerScreen controller={controllerFor('focus')} />)
  expect(screen.getByTestId('mascot')).toHaveAttribute('data-pose', 'work')

  rerender(<TimerScreen controller={controllerFor('paused')} />)
  expect(screen.getByTestId('mascot')).toHaveAttribute('data-pose', 'pause')

  rerender(<TimerScreen controller={controllerFor('shortBreak')} />)
  expect(screen.getByText('Время отдыхать')).toBeInTheDocument()
  expect(screen.getByTestId('mascot')).toHaveAttribute('data-pose', 'stretch')

  rerender(<TimerScreen controller={controllerFor('longBreak')} />)
  expect(screen.getByTestId('mascot')).toHaveAttribute('data-pose', 'sleep')
})

test('renders English paused controls and forwards task edits', async () => {
  const controller = controllerFor('paused', 'en')
  const user = userEvent.setup()

  render(<TimerScreen controller={controller} />)

  const task = screen.getByLabelText('What are we doing?')
  fireEvent.change(task, { target: { value: 'Science' } })
  await user.click(screen.getByRole('button', { name: 'Resume' }))

  expect(controller.setTaskName).toHaveBeenLastCalledWith('Science')
  expect(controller.resume).toHaveBeenCalledOnce()
})

test('resets the whole cycle from the localized completion control', async () => {
  const controller = controllerFor('focus', 'en')
  const user = userEvent.setup()

  render(<TimerScreen controller={controller} />)
  const completion = screen.getByRole('button', { name: "I'm done!" })
  expect(completion.querySelector('.lucide-check')).toBeInTheDocument()
  await user.click(completion)

  expect(controller.reset).toHaveBeenCalledOnce()
  expect(controller.finishCurrentPhase).not.toHaveBeenCalled()
})

test('shows a short localized audio status while keeping timer controls available', () => {
  const controller = controllerFor('focus', 'en')
  controller.audioStatus = 'blocked'

  render(<TimerScreen controller={controller} />)

  expect(screen.getByText('Could not play sound')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Pause' })).toBeEnabled()
})
