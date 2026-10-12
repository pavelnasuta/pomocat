import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { loadAppData, saveAppData } from '../data/storage'
import { App } from './App'

const deviceMocks = vi.hoisted(() => ({
  audio: {
    select: vi.fn().mockResolvedValue(undefined),
    setVolume: vi.fn(),
    start: vi.fn().mockResolvedValue('playing'),
    stop: vi.fn(),
  },
  wakeLock: {
    acquire: vi.fn().mockResolvedValue('active'),
    release: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../device/audio', () => ({
  AudioController: class {
    select = deviceMocks.audio.select
    setVolume = deviceMocks.audio.setVolume
    start = deviceMocks.audio.start
    stop = deviceMocks.audio.stop
  },
}))

vi.mock('../device/wakeLock', () => ({
  WakeLockController: class {
    acquire = deviceMocks.wakeLock.acquire
    release = deviceMocks.wakeLock.release
  },
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

beforeEach(() => {
  vi.clearAllMocks()
  deviceMocks.audio.select.mockResolvedValue(undefined)
  deviceMocks.audio.start.mockResolvedValue('playing')
  deviceMocks.wakeLock.acquire.mockResolvedValue('active')
  deviceMocks.wakeLock.release.mockResolvedValue(undefined)
  localStorage.clear()
  const data = loadAppData(localStorage)
  data.settings.locale = 'ru'
  saveAppData(localStorage, data)
})

test('shows onboarding before a child name has been saved', () => {
  render(<App />)

  expect(screen.getByRole('heading', { name: 'Как тебя зовут?' })).toBeInTheDocument()
})

test('restores an active session and renders its remaining time', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-11T12:00:00.000Z'))
  const data = loadAppData(localStorage)
  data.settings.childName = 'Маша'
  data.activeSession = {
    phase: 'focus',
    startedAt: new Date(Date.now() - 60_000).toISOString(),
    remainingSeconds: 25 * 60,
    completedRounds: 0,
    targetEndsAt: Date.now() + 24 * 60 * 1_000,
    totalMs: 25 * 60 * 1_000,
  }
  saveAppData(localStorage, data)

  render(<App />)

  expect(screen.getByText('24:00')).toBeInTheDocument()
  vi.useRealTimers()
})

test('opens the advice list from navigation', async () => {
  const data = loadAppData(localStorage)
  data.settings.childName = 'Маша'
  saveAppData(localStorage, data)
  const user = userEvent.setup()

  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Советы' }))
  await user.click(screen.getByRole('button', { name: /Как начать без уговоров/ }))

  expect(screen.getByRole('heading', { name: 'Как начать без уговоров' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Назад' }))
  expect(screen.getByRole('heading', { name: 'Советы для продуктивного дня' })).toBeInTheDocument()
})

test('persists a setting locale change and passes the effective locale to visible app copy', async () => {
  const data = loadAppData(localStorage)
  data.settings.childName = 'Маша'
  saveAppData(localStorage, data)
  const user = (await import('@testing-library/user-event')).default.setup()

  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Настройки' }))
  await user.selectOptions(screen.getByLabelText('Язык'), 'en')

  expect(screen.getByText('Hello, Маша')).toBeInTheDocument()
  expect(document.documentElement.lang).toBe('en')
  expect(loadAppData(localStorage).settings.locale).toBe('en')
})

test('clears storage only after confirmation and returns to onboarding', async () => {
  const data = loadAppData(localStorage)
  data.settings.childName = 'Маша'
  data.history = [{ id: 'focus', phase: 'focus', durationMinutes: 25, completedAt: '2026-10-11T10:00:00.000Z' }]
  saveAppData(localStorage, data)
  const user = (await import('@testing-library/user-event')).default.setup()

  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Настройки' }))
  await user.click(screen.getByRole('button', { name: 'Очистить все данные' }))
  expect(loadAppData(localStorage).history).toHaveLength(1)
  await user.click(screen.getByRole('button', { name: 'Да, очистить данные' }))

  expect(screen.getByRole('heading')).toHaveTextContent(/Как тебя зовут\?|What is your name\?/)
  expect(loadAppData(localStorage).history).toEqual([])
  expect(loadAppData(localStorage).settings.childName).toBeUndefined()
})

test('clears active focus resources before showing onboarding', async () => {
  const data = loadAppData(localStorage)
  data.settings.childName = 'Маша'
  data.settings.selectedSound = 'rain'
  data.settings.keepScreenAwake = true
  saveAppData(localStorage, data)
  const release = deferred<void>()
  deviceMocks.wakeLock.release.mockImplementation(() => release.promise)
  const user = userEvent.setup()

  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Начать' }))
  await waitFor(() => {
    expect(deviceMocks.audio.start).toHaveBeenCalledOnce()
    expect(deviceMocks.wakeLock.acquire).toHaveBeenCalledOnce()
  })

  await user.click(screen.getByRole('button', { name: 'Настройки' }))
  await user.click(screen.getByRole('button', { name: 'Очистить все данные' }))
  await user.click(screen.getByRole('button', { name: 'Да, очистить данные' }))

  await waitFor(() => {
    expect(deviceMocks.audio.stop).toHaveBeenCalledOnce()
    expect(deviceMocks.wakeLock.release).toHaveBeenCalledOnce()
  })
  expect(screen.queryByRole('heading', { name: /Как тебя зовут\?|What is your name\?/ })).not.toBeInTheDocument()

  release.resolve(undefined)

  expect(await screen.findByRole('heading', { name: /Как тебя зовут\?|What is your name\?/ })).toBeInTheDocument()
  expect(loadAppData(localStorage).activeSession).toBeUndefined()
})
