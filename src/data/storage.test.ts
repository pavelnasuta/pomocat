import { clearAppData, loadAppData, saveAppData } from './storage'

test('returns safe defaults for malformed saved data', () => {
  localStorage.setItem('pomokitty:data:v1', '{not-json')

  expect(loadAppData(localStorage).settings.childName).toBeUndefined()
})

test('saves data that can be loaded again', () => {
  const data = {
    version: 1 as const,
    settings: {
      childName: 'Маша',
      locale: 'ru' as const,
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      roundsBeforeLongBreak: 4,
      autoStartNext: false,
      animationsEnabled: true,
      notificationsEnabled: false,
      keepScreenAwake: false,
      selectedSound: 'rain' as const,
      soundVolume: 0.5,
    },
    history: [],
  }

  saveAppData(localStorage, data)

  expect(loadAppData(localStorage)).toEqual(data)
})

test('normalizes no-longer-offered sound choices to silence', () => {
  localStorage.setItem(
    'pomokitty:data:v1',
    JSON.stringify({
      version: 1,
      settings: {
        locale: 'ru', focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, roundsBeforeLongBreak: 4,
        autoStartNext: false, animationsEnabled: true, notificationsEnabled: false, keepScreenAwake: false,
        selectedSound: 'forest', soundVolume: 0.5,
      },
      history: [],
    }),
  )

  expect(loadAppData(localStorage).settings.selectedSound).toBe('none')
})

test('clears saved data', () => {
  localStorage.setItem('pomokitty:data:v1', JSON.stringify({ version: 1 }))

  clearAppData(localStorage)

  expect(localStorage.getItem('pomokitty:data:v1')).toBeNull()
})

test('falls back to defaults for an unsupported persisted version', () => {
  localStorage.setItem(
    'pomokitty:data:v1',
    JSON.stringify({
      version: 2,
      settings: {
        locale: 'en',
        focusMinutes: 99,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        roundsBeforeLongBreak: 4,
        autoStartNext: false,
        animationsEnabled: true,
        notificationsEnabled: false,
        keepScreenAwake: false,
        selectedSound: 'none',
        soundVolume: 0.5,
      },
      history: [],
    }),
  )

  expect(loadAppData(localStorage).version).toBe(1)
  expect(loadAppData(localStorage).settings.focusMinutes).toBe(25)
})

test('uses Russian defaults only for a Russian browser language', () => {
  const languageDescriptor = Object.getOwnPropertyDescriptor(navigator, 'language')
  Object.defineProperty(navigator, 'language', {
    configurable: true,
    value: 'ru-RU',
  })
  localStorage.clear()

  expect(loadAppData(localStorage).settings.locale).toBe('ru')

  if (languageDescriptor) {
    Object.defineProperty(navigator, 'language', languageDescriptor)
  }
})

test('uses English defaults for a non-Russian browser language', () => {
  const languageDescriptor = Object.getOwnPropertyDescriptor(navigator, 'language')
  Object.defineProperty(navigator, 'language', {
    configurable: true,
    value: 'en-US',
  })
  localStorage.clear()

  expect(loadAppData(localStorage).settings.locale).toBe('en')

  if (languageDescriptor) {
    Object.defineProperty(navigator, 'language', languageDescriptor)
  }
})

test('rejects non-finite and out-of-range persisted settings', () => {
  localStorage.setItem(
    'pomokitty:data:v1',
    JSON.stringify({
      version: 1,
      settings: {
        locale: 'en',
        focusMinutes: 0,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        roundsBeforeLongBreak: 4,
        autoStartNext: false,
        animationsEnabled: true,
        notificationsEnabled: false,
        keepScreenAwake: false,
        selectedSound: 'none',
        soundVolume: 1.5,
      },
      history: [],
    }),
  )

  expect(loadAppData(localStorage).settings.focusMinutes).toBe(25)
})

test('discards a malformed active deadline without discarding valid saved settings', () => {
  const data = {
    version: 1,
    settings: {
      locale: 'en', focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, roundsBeforeLongBreak: 4,
      autoStartNext: false, animationsEnabled: true, notificationsEnabled: false, keepScreenAwake: false,
      selectedSound: 'none', soundVolume: 0.5,
    },
    history: [],
    activeSession: {
      phase: 'focus', startedAt: '2026-10-11T12:00:00.000Z', remainingSeconds: 60,
      completedRounds: 0, targetEndsAt: 'not-a-timestamp', totalMs: 60_000,
    },
  }
  localStorage.setItem('pomokitty:data:v1', JSON.stringify(data))

  const loaded = loadAppData(localStorage)
  expect(loaded.settings.locale).toBe('en')
  expect(loaded.activeSession).toBeUndefined()
})

test('never propagates storage write or clear failures', () => {
  const failingStorage = {
    getItem: vi.fn(() => { throw new DOMException('blocked') }),
    setItem: vi.fn(() => { throw new DOMException('blocked') }),
    removeItem: vi.fn(() => { throw new DOMException('blocked') }),
  } as unknown as Storage
  const data = loadAppData(localStorage)

  expect(saveAppData(failingStorage, data)).toBe(false)
  expect(clearAppData(failingStorage)).toBe(false)
})
