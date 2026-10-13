import type { ActiveSession, Phase, PomodoroSettings, SessionHistoryItem } from './types'

export interface TimerView {
  phase: Phase
  remainingMs: number
  totalMs: number
  completedFocusRounds: number
  isFinished: boolean
}

export interface PhaseTransition {
  nextPhase: Exclude<Phase, 'paused'>
  nextSession: ActiveSession
  historyItem?: SessionHistoryItem
}

const minuteMs = 60 * 1_000

function durationMs(phase: Exclude<Phase, 'idle' | 'paused'>, settings: PomodoroSettings): number {
  if (phase === 'focus') return settings.focusMinutes * minuteMs
  if (phase === 'shortBreak') return settings.shortBreakMinutes * minuteMs
  return settings.longBreakMinutes * minuteMs
}

function sessionFor(
  phase: Exclude<Phase, 'idle' | 'paused'>,
  now: number,
  settings: PomodoroSettings,
  completedFocusRounds: number,
  taskName?: string,
): ActiveSession {
  const totalMs = durationMs(phase, settings)

  return {
    phase,
    startedAt: new Date(now).toISOString(),
    remainingSeconds: totalMs / 1_000,
    completedRounds: completedFocusRounds,
    completedFocusRounds,
    targetEndsAt: now + totalMs,
    totalMs,
    ...(taskName === undefined ? {} : { taskName }),
  }
}

export function startSession(now: number, settings: PomodoroSettings, taskName?: string): ActiveSession {
  return sessionFor('focus', now, settings, 0, taskName)
}

export function getTimerView(session: ActiveSession, now: number): TimerView {
  const totalMs = session.totalMs ?? session.remainingSeconds * 1_000
  const targetEndsAt =
    session.targetEndsAt ?? Date.parse(session.startedAt) + session.remainingSeconds * 1_000
  const remainingMs = Math.max(
    0,
    session.phase === 'paused'
      ? (session.remainingMsWhenPaused ?? session.remainingSeconds * 1_000)
      : targetEndsAt - now,
  )

  return {
    phase: session.phase,
    remainingMs,
    totalMs,
    completedFocusRounds: session.completedFocusRounds ?? session.completedRounds,
    isFinished: remainingMs === 0,
  }
}

export function pauseSession(session: ActiveSession, now: number): ActiveSession {
  if (session.phase === 'paused' || session.phase === 'idle') return session

  const remainingMsWhenPaused = getTimerView(session, now).remainingMs

  return {
    ...session,
    phase: 'paused',
    remainingSeconds: remainingMsWhenPaused / 1_000,
    remainingMsWhenPaused,
    pausedPhase: session.phase,
  }
}

export function resumeSession(session: ActiveSession, now: number): ActiveSession {
  if (session.phase !== 'paused') return session

  const { remainingMsWhenPaused, pausedPhase, ...activeSession } = session
  if (!pausedPhase) {
    // Legacy paused records do not retain their original phase, so resuming
    // them as focus could turn a saved break into concentration time.
    return {
      ...activeSession,
      phase: 'idle',
      remainingSeconds: 0,
      targetEndsAt: undefined,
      totalMs: undefined,
    }
  }

  const remainingMs = remainingMsWhenPaused ?? session.remainingSeconds * 1_000

  return {
    ...activeSession,
    phase: pausedPhase,
    startedAt: new Date(now).toISOString(),
    remainingSeconds: remainingMs / 1_000,
    targetEndsAt: now + remainingMs,
  }
}

export function completeCurrentPhase(
  session: ActiveSession,
  settings: PomodoroSettings,
  now: number,
  countFocusRound = true,
): PhaseTransition {
  const completedFocusRounds = session.completedFocusRounds ?? session.completedRounds

  if (session.phase === 'focus') {
    const nextCompletedFocusRounds = completedFocusRounds + (countFocusRound ? 1 : 0)
    const nextPhase =
      countFocusRound && nextCompletedFocusRounds % settings.roundsBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak'

    const plannedDurationMs = session.totalMs ?? durationMs('focus', settings)
    const actualDurationMs = Math.max(0, plannedDurationMs - getTimerView(session, now).remainingMs)

    return {
      nextPhase,
      nextSession: sessionFor(nextPhase, now, settings, nextCompletedFocusRounds, session.taskName),
      historyItem: {
        id: `focus-${now}-${nextCompletedFocusRounds}`,
        phase: 'focus',
        durationMinutes: actualDurationMs / minuteMs,
        completedAt: new Date(now).toISOString(),
        actualDurationMs,
        plannedDurationMs,
        ...(session.taskName === undefined ? {} : { taskName: session.taskName }),
      },
    }
  }

  return {
    nextPhase: 'focus',
    nextSession: sessionFor('focus', now, settings, completedFocusRounds, session.taskName),
  }
}
