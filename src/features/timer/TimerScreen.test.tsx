import { render, screen } from '@testing-library/react'
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
    soundEnabled: true,
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
    toggleSound: vi.fn(),
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    skip: vi.fn(),
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
  expect(screen.queryByLabelText('Что делаем?')).not.toBeInTheDocument()
  expect(screen.getByTestId('mascot')).toHaveAttribute('data-pose', 'work')
  expect(screen.getByRole('button', { name: 'Пауза' })).toContainElement(document.querySelector('.lucide-pause'))
  await user.click(screen.getByRole('button', { name: 'Пауза' }))

  expect(controller.pause).toHaveBeenCalledTimes(1)
})

test('toggles the terracotta background-sound control below timer progress', async () => {
  const controller = controllerFor()
  const user = userEvent.setup()

  render(<TimerScreen controller={controller} />)

  const toggle = screen.getByRole('button', { name: 'Выключить фоновый звук' })
  expect(toggle).toContainElement(document.querySelector('.lucide-volume-2'))
  await user.click(toggle)

  expect(controller.toggleSound).toHaveBeenCalledOnce()
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

test('renders English paused controls without a task field', async () => {
  const controller = controllerFor('paused', 'en')
  const user = userEvent.setup()

  render(<TimerScreen controller={controller} />)

  expect(screen.queryByLabelText('What are we doing?')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Resume' }))

  expect(controller.resume).toHaveBeenCalledOnce()
})

test('places skip and localized completion controls side by side below the primary control', async () => {
  const controller = controllerFor('focus', 'en')
  const user = userEvent.setup()

  render(<TimerScreen controller={controller} />)
  const skip = screen.getByRole('button', { name: 'Skip' })
  const completion = screen.getByRole('button', { name: "I'm all done" })
  expect(completion.querySelector('.lucide-check')).toBeInTheDocument()
  expect(skip.querySelector('.lucide-skip-forward')).toBeInTheDocument()
  expect(skip.parentElement).toHaveClass('timer-screen__secondary-actions')
  expect(completion.parentElement).toBe(skip.parentElement)
  await user.click(skip)
  await user.click(completion)

  expect(controller.skip).toHaveBeenCalledOnce()
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
