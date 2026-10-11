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
