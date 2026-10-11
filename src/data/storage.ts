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
  'rain',
  'forest',
  'fireplace',
  'ocean',
  'whiteNoise',
  'none',
]
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

function isSoundId(value: unknown): value is SoundId {
  return typeof value === 'string' && soundIds.includes(value as SoundId)
}

function isPhase(value: unknown): value is Phase {
  return typeof value === 'string' && phases.includes(value as Phase)
}

function isSettings(value: unknown): value is PomodoroSettings {
  if (!isRecord(value)) return false

  return (
    (value.childName === undefined || typeof value.childName === 'string') &&
    isLocale(value.locale) &&
    typeof value.focusMinutes === 'number' &&
    typeof value.shortBreakMinutes === 'number' &&
    typeof value.longBreakMinutes === 'number' &&
    typeof value.roundsBeforeLongBreak === 'number' &&
    typeof value.autoStartNext === 'boolean' &&
    typeof value.animationsEnabled === 'boolean' &&
    typeof value.notificationsEnabled === 'boolean' &&
    typeof value.keepScreenAwake === 'boolean' &&
    isSoundId(value.selectedSound) &&
    typeof value.soundVolume === 'number'
  )
}

function isActiveSession(value: unknown): value is ActiveSession {
  return (
    isRecord(value) &&
    isPhase(value.phase) &&
    typeof value.startedAt === 'string' &&
    typeof value.remainingSeconds === 'number' &&
    typeof value.completedRounds === 'number'
  )
}

function isHistoryItem(value: unknown): value is SessionHistoryItem {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.phase === 'string' &&
    historyPhases.includes(value.phase as SessionHistoryItem['phase']) &&
    typeof value.durationMinutes === 'number' &&
    typeof value.completedAt === 'string'
  )
}

function isAppData(value: unknown): value is AppData {
  return (
    isRecord(value) &&
    value.version === 1 &&
    isSettings(value.settings) &&
    (value.activeSession === undefined || isActiveSession(value.activeSession)) &&
    Array.isArray(value.history) &&
    value.history.every(isHistoryItem)
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
    selectedSound: 'none',
    soundVolume: 0.5,
  }
}

function defaultAppData(): AppData {
  return {
    version: 1,
    settings: defaultSettings(),
    history: [],
  }
}

export function loadAppData(storage: Storage): AppData {
  try {
    const savedData = storage.getItem(STORAGE_KEY)
    if (savedData === null) return defaultAppData()

    const parsedData: unknown = JSON.parse(savedData)
    return isAppData(parsedData) ? parsedData : defaultAppData()
  } catch {
    return defaultAppData()
  }
}

export function saveAppData(storage: Storage, data: AppData): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function clearAppData(storage: Storage): void {
  storage.removeItem(STORAGE_KEY)
}
