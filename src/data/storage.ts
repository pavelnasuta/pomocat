import { themeIds, type ThemeId } from '../theme/themes'
import type {
  ActiveSession,
  AppData,
  Locale,
  Phase,
  PomodoroSettings,
  SessionHistoryItem,
  SoundId,
} from '../domain/types'

const STORAGE_KEY = 'pomokitty:data:v1'

const soundIds: SoundId[] = [
  'brownNoise',
  'forestRain',
  'nightForest',
  'ocean',
  'rain',
  'forest',
  'fireplace',
  'whiteNoise',
  'none',
]
const offeredSoundIds: SoundId[] = ['brownNoise', 'forestRain', 'ocean', 'nightForest']
const phases: Phase[] = ['idle', 'focus', 'shortBreak', 'longBreak', 'paused']
const historyPhases: SessionHistoryItem['phase'][] = [
  'focus',
  'shortBreak',
  'longBreak',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLocale(value: unknown): value is Locale {
  return value === 'ru' || value === 'en'
}

function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && themeIds.includes(value as ThemeId)
}

function isSoundId(value: unknown): value is SoundId {
  return typeof value === 'string' && soundIds.includes(value as SoundId)
}

function isPhase(value: unknown): value is Phase {
  return typeof value === 'string' && phases.includes(value as Phase)
}

function isFiniteNumberInRange(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
}

function isNonnegativeInteger(value: unknown, maximum: number): value is number {
  return Number.isInteger(value) && typeof value === 'number' && value >= 0 && value <= maximum
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isSettings(value: unknown): value is PomodoroSettings {
  if (!isRecord(value)) return false

  return (
    (value.childName === undefined || typeof value.childName === 'string') &&
    isLocale(value.locale) &&
    isFiniteNumberInRange(value.focusMinutes, 1, 180) &&
    isFiniteNumberInRange(value.shortBreakMinutes, 1, 180) &&
    isFiniteNumberInRange(value.longBreakMinutes, 1, 180) &&
    isFiniteNumberInRange(value.roundsBeforeLongBreak, 1, 12) &&
    typeof value.autoStartNext === 'boolean' &&
    typeof value.animationsEnabled === 'boolean' &&
    typeof value.notificationsEnabled === 'boolean' &&
    typeof value.keepScreenAwake === 'boolean' &&
    (value.theme === undefined || isThemeId(value.theme)) &&
    isSoundId(value.selectedSound) &&
    isFiniteNumberInRange(value.soundVolume, 0, 1)
  )
}

function isActiveSession(value: unknown): value is ActiveSession {
  return (
    isRecord(value) &&
    isPhase(value.phase) &&
    isValidDate(value.startedAt) &&
    isFiniteNumberInRange(value.remainingSeconds, 0, 180 * 60) &&
    isNonnegativeInteger(value.completedRounds, 10_000) &&
    (value.targetEndsAt === undefined || isFiniteNumberInRange(value.targetEndsAt, 0, 8.64e15)) &&
    (value.totalMs === undefined || isFiniteNumberInRange(value.totalMs, 1, 180 * 60 * 1_000)) &&
    (value.completedFocusRounds === undefined || isNonnegativeInteger(value.completedFocusRounds, 10_000)) &&
    (value.remainingMsWhenPaused === undefined || isFiniteNumberInRange(value.remainingMsWhenPaused, 0, 180 * 60 * 1_000)) &&
    (value.pausedPhase === undefined || (value.pausedPhase !== 'idle' && value.pausedPhase !== 'paused' && isPhase(value.pausedPhase))) &&
    (value.taskName === undefined || typeof value.taskName === 'string')
  )
}

function isHistoryItem(value: unknown): value is SessionHistoryItem {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.phase === 'string' &&
    historyPhases.includes(value.phase as SessionHistoryItem['phase']) &&
    isFiniteNumberInRange(value.durationMinutes, 0, 180) &&
    isValidDate(value.completedAt) &&
    (value.actualDurationMs === undefined || isFiniteNumberInRange(value.actualDurationMs, 0, 180 * 60 * 1_000)) &&
    (value.plannedDurationMs === undefined || isFiniteNumberInRange(value.plannedDurationMs, 1, 180 * 60 * 1_000)) &&
    (value.earnedCats === undefined || isNonnegativeInteger(value.earnedCats, 10_000)) &&
    (value.taskName === undefined || typeof value.taskName === 'string')
  )
}

function isAppData(value: unknown): value is Omit<AppData, 'activeSession'> & { activeSession?: unknown } {
  return (
    isRecord(value) &&
    value.version === 1 &&
    isSettings(value.settings) &&
    Array.isArray(value.history) &&
    value.history.every(isHistoryItem) &&
    (value.catProgressMs === undefined || isFiniteNumberInRange(value.catProgressMs, 0, 180 * 60 * 1_000))
  )
}

function defaultLocale(): Locale {
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

function defaultSettings(): PomodoroSettings {
  return {
    locale: defaultLocale(),
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    roundsBeforeLongBreak: 4,
    autoStartNext: false,
    animationsEnabled: true,
    notificationsEnabled: false,
    keepScreenAwake: false,
    theme: 'terracotta',
    selectedSound: 'forestRain',
    soundEnabled: true,
    soundVolume: 0.5,
  }
}

function defaultAppData(): AppData {
  return {
    version: 1,
    settings: defaultSettings(),
    history: [],
    catProgressMs: 0,
  }
}

export function loadAppData(storage: Storage): AppData {
  try {
    const savedData = storage.getItem(STORAGE_KEY)
    if (savedData === null) return defaultAppData()

    const parsedData: unknown = JSON.parse(savedData)
    if (!isAppData(parsedData)) return defaultAppData()
    const { activeSession, ...safeData } = parsedData
    const normalizedData = {
      ...safeData,
      settings: {
        ...safeData.settings,
        selectedSound: offeredSoundIds.includes(safeData.settings.selectedSound) ? safeData.settings.selectedSound : 'forestRain',
        theme: safeData.settings.theme ?? 'terracotta',
        soundEnabled: safeData.settings.soundEnabled !== false,
      },
      catProgressMs: safeData.catProgressMs ?? 0,
    }
    return isActiveSession(activeSession) ? { ...normalizedData, activeSession } : normalizedData
  } catch {
    return defaultAppData()
  }
}

export function saveAppData(storage: Storage, data: AppData): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function clearAppData(storage: Storage): boolean {
  try {
    storage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
