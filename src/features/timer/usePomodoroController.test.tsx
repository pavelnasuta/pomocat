import { act, renderHook } from '@testing-library/react'
import { loadAppData, saveAppData } from '../../data/storage'
import { startSession } from '../../domain/timer'
import { usePomodoroController } from './usePomodoroController'

beforeEach(() => {
  localStorage.clear()
})

test('restores an active session with time derived from its target deadline', () => {
  const now = 60_000
  const data = loadAppData(localStorage)
  data.activeSession = startSession(0, data.settings, 'Math')
  saveAppData(localStorage, data)

  const { result } = renderHook(() => usePomodoroController({ now: () => now }))

  expect(result.current.view).toMatchObject({
    phase: 'focus',
    remainingMs: 24 * 60 * 1_000,
  })
  expect(result.current.taskName).toBe('Math')
})

test('starts and persists a focus session after a user action', async () => {
  const now = 5_000
  const { result } = renderHook(() => usePomodoroController({ now: () => now }))

  await act(async () => {
    await result.current.start()
  })

  expect(result.current.view).toMatchObject({
    phase: 'focus',
    remainingMs: 25 * 60 * 1_000,
  })
  expect(loadAppData(localStorage).activeSession).toMatchObject({
    phase: 'focus',
    targetEndsAt: now + 25 * 60 * 1_000,
  })
})

test('starts audio and wake lock only after a user starts focus', async () => {
  const audio = { start: vi.fn().mockResolvedValue('playing'), stop: vi.fn() }
  const wakeLock = {
    acquire: vi.fn().mockResolvedValue('active'),
    reacquireWhenVisible: vi.fn().mockResolvedValue('active'),
    release: vi.fn().mockResolvedValue(undefined),
  }
  const data = loadAppData(localStorage)
  data.settings.keepScreenAwake = true
  data.settings.selectedSound = 'rain'
  data.activeSession = startSession(0, data.settings)
  saveAppData(localStorage, data)

  const { result } = renderHook(() =>
    usePomodoroController({ now: () => 1_000, audio, wakeLock }),
  )

  expect(audio.start).not.toHaveBeenCalled()
  expect(wakeLock.acquire).not.toHaveBeenCalled()

  await act(async () => {
    await result.current.pause()
  })
  await act(async () => {
    await result.current.resume()
  })

  expect(audio.start).toHaveBeenCalledTimes(1)
  expect(wakeLock.acquire).toHaveBeenCalledTimes(1)
  expect(result.current.wakeLockStatus).toBe('active')
})

test('pauses a focus session, persists it, and releases audio and wake lock', async () => {
  const audio = { start: vi.fn().mockResolvedValue('playing'), stop: vi.fn() }
  const wakeLock = {
    acquire: vi.fn().mockResolvedValue('active'),
    reacquireWhenVisible: vi.fn().mockResolvedValue('active'),
    release: vi.fn().mockResolvedValue(undefined),
  }
  const data = loadAppData(localStorage)
  data.settings.keepScreenAwake = true
  data.settings.selectedSound = 'rain'
  data.activeSession = startSession(0, data.settings)
  saveAppData(localStorage, data)
  const { result } = renderHook(() =>
    usePomodoroController({ now: () => 60_000, audio, wakeLock }),
  )

  await act(async () => {
    await result.current.pause()
  })

  expect(result.current.view).toMatchObject({ phase: 'paused', remainingMs: 24 * 60 * 1_000 })
  expect(loadAppData(localStorage).activeSession).toMatchObject({ phase: 'paused' })
  expect(audio.stop).toHaveBeenCalledTimes(1)
  expect(wakeLock.release).toHaveBeenCalledTimes(1)
  expect(result.current.wakeLockStatus).toBe('idle')
})

test('persists the next phase and releases resources when the current phase finishes', async () => {
  const audio = { start: vi.fn().mockResolvedValue('playing'), stop: vi.fn() }
  const wakeLock = {
    acquire: vi.fn().mockResolvedValue('active'),
    reacquireWhenVisible: vi.fn().mockResolvedValue('active'),
    release: vi.fn().mockResolvedValue(undefined),
  }
  const data = loadAppData(localStorage)
  data.settings.keepScreenAwake = true
  data.activeSession = startSession(0, data.settings, 'Math')
  saveAppData(localStorage, data)
  const { result } = renderHook(() =>
    usePomodoroController({ now: () => 24 * 60 * 1_000, audio, wakeLock }),
  )

  await act(async () => {
    await result.current.finishCurrentPhase()
  })

  expect(loadAppData(localStorage)).toMatchObject({
    activeSession: { phase: 'shortBreak', taskName: 'Math' },
    history: [{ phase: 'focus', durationMinutes: 25 }],
  })
  expect(audio.stop).toHaveBeenCalledTimes(1)
  expect(wakeLock.release).toHaveBeenCalledTimes(1)
})

test('finishes an elapsed active phase during the display refresh', async () => {
  vi.useFakeTimers()
  let now = 0
  const audio = { start: vi.fn().mockResolvedValue('playing'), stop: vi.fn() }
  const wakeLock = {
    acquire: vi.fn().mockResolvedValue('active'),
    reacquireWhenVisible: vi.fn().mockResolvedValue('active'),
    release: vi.fn().mockResolvedValue(undefined),
  }
  const data = loadAppData(localStorage)
  data.settings.keepScreenAwake = true
  data.activeSession = {
    ...startSession(0, data.settings),
    targetEndsAt: 1_000,
    totalMs: 1_000,
    remainingSeconds: 1,
  }
  saveAppData(localStorage, data)
  const { result } = renderHook(() => usePomodoroController({ now: () => now, audio, wakeLock }))

  now = 1_000
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250)
  })

  expect(result.current.view.phase).toBe('shortBreak')
  expect(wakeLock.release).toHaveBeenCalledTimes(1)
  vi.useRealTimers()
})

test('reacquires an opted-in focus wake lock after visible return', async () => {
  const audio = { start: vi.fn().mockResolvedValue('playing'), stop: vi.fn() }
  const wakeLock = {
    acquire: vi.fn().mockResolvedValue('active'),
    reacquireWhenVisible: vi.fn().mockResolvedValue('active'),
    release: vi.fn().mockResolvedValue(undefined),
  }
  const data = loadAppData(localStorage)
  data.settings.keepScreenAwake = true
  saveAppData(localStorage, data)
  const { result } = renderHook(() => usePomodoroController({ audio, wakeLock }))

  await act(async () => {
    await result.current.start()
  })
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
  document.dispatchEvent(new Event('visibilitychange'))
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'))
  })

  expect(wakeLock.reacquireWhenVisible).toHaveBeenCalledTimes(1)
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
})

test('releases active focus resources when the controller unmounts', async () => {
  const audio = { start: vi.fn().mockResolvedValue('playing'), stop: vi.fn() }
  const wakeLock = {
    acquire: vi.fn().mockResolvedValue('active'),
    reacquireWhenVisible: vi.fn().mockResolvedValue('active'),
    release: vi.fn().mockResolvedValue(undefined),
  }
  const data = loadAppData(localStorage)
  data.settings.keepScreenAwake = true
  data.settings.selectedSound = 'rain'
  saveAppData(localStorage, data)
  const { result, unmount } = renderHook(() => usePomodoroController({ audio, wakeLock }))

  await act(async () => {
    await result.current.start()
  })
  unmount()

  expect(audio.stop).toHaveBeenCalledTimes(1)
  expect(wakeLock.release).toHaveBeenCalledTimes(1)
})
