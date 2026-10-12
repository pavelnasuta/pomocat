export type Locale = 'ru' | 'en'

export type SoundId =
  | 'rain'
  | 'forest'
  | 'fireplace'
  | 'ocean'
  | 'whiteNoise'
  | 'none'

export type Phase = 'idle' | 'focus' | 'shortBreak' | 'longBreak' | 'paused'

export interface PomodoroSettings {
  childName?: string
  locale: Locale
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  roundsBeforeLongBreak: number
  autoStartNext: boolean
  animationsEnabled: boolean
  notificationsEnabled: boolean
  keepScreenAwake: boolean
  selectedSound: SoundId
  soundVolume: number
}

export interface ActiveSession {
  phase: Phase
  startedAt: string
  remainingSeconds: number
  completedRounds: number
  targetEndsAt?: number
  totalMs?: number
  completedFocusRounds?: number
  remainingMsWhenPaused?: number
  pausedPhase?: Exclude<Phase, 'idle' | 'paused'>
  taskName?: string
}

export interface SessionHistoryItem {
  id: string
  phase: Exclude<Phase, 'idle' | 'paused'>
  durationMinutes: number
  completedAt: string
  /** Actual elapsed duration, retained for precise future statistics. */
  actualDurationMs?: number
  /** Original phase duration, useful when a child finishes early. */
  plannedDurationMs?: number
  taskName?: string
}

export interface AppData {
  version: 1
  settings: PomodoroSettings
  activeSession?: ActiveSession
  history: SessionHistoryItem[]
}
