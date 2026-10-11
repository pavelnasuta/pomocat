import { completeCurrentPhase, getTimerView, pauseSession, resumeSession, startSession } from './timer'
import type { PomodoroSettings } from './types'

const settings: PomodoroSettings = {
  locale: 'en',
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  roundsBeforeLongBreak: 4,
  autoStartNext: false,
  animationsEnabled: true,
  notificationsEnabled: false,
  keepScreenAwake: false,
  selectedSound: 'none',
  soundVolume: 0.5,
}

test('derives remaining focus time from targetEndsAt after a page restore', () => {
  const session = startSession(1_000, settings)

  expect(session.targetEndsAt).toBe(25 * 60 * 1_000 + 1_000)
  expect(getTimerView(session, 61_000).remainingMs).toBe(24 * 60 * 1_000)
})

test('starts a long break after the configured number of focus rounds', () => {
  const session = { ...startSession(0, settings), completedFocusRounds: 3 }

  expect(completeCurrentPhase(session, settings, 25 * 60 * 1_000).nextPhase).toBe('longBreak')
})

test('freezes the remaining duration when a session is paused', () => {
  const paused = pauseSession(startSession(0, settings), 60 * 1_000)

  expect(paused.phase).toBe('paused')
  expect(getTimerView(paused, 120 * 1_000).remainingMs).toBe(24 * 60 * 1_000)
})

test('resumes a paused focus session from its saved remaining duration', () => {
  const paused = pauseSession(startSession(0, settings), 60 * 1_000)
  const resumed = resumeSession(paused, 120 * 1_000)

  expect(resumed.phase).toBe('focus')
  expect(resumed).not.toHaveProperty('remainingMsWhenPaused')
  expect(getTimerView(resumed, 180 * 1_000).remainingMs).toBe(23 * 60 * 1_000)
})

test('clamps elapsed sessions to zero remaining time', () => {
  const session = startSession(0, settings)

  expect(getTimerView(session, 26 * 60 * 1_000).remainingMs).toBe(0)
  expect(getTimerView(session, 26 * 60 * 1_000).isFinished).toBe(true)
})

test('returns one completed focus history item when focus ends', () => {
  const transition = completeCurrentPhase(startSession(0, settings), settings, 25 * 60 * 1_000)

  expect(transition.historyItem).toMatchObject({
    phase: 'focus',
    durationMinutes: 25,
    completedAt: '1970-01-01T00:25:00.000Z',
  })
})

test('does not add a history item when a break ends', () => {
  const breakTransition = completeCurrentPhase(startSession(0, settings), settings, 25 * 60 * 1_000)
  const nextTransition = completeCurrentPhase(
    breakTransition.nextSession,
    settings,
    30 * 60 * 1_000,
  )

  expect(nextTransition.nextPhase).toBe('focus')
  expect(nextTransition.historyItem).toBeUndefined()
})
