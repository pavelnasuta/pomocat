import { StrictMode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { loadAppData, saveAppData } from '../../data/storage'
import { WakeLockController } from '../../device/wakeLock'
import { startSession } from '../../domain/timer'
import { usePomodoroController } from './usePomodoroController'

beforeEach(() => {
  localStorage.clear()
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function visibilityDocument() {
  let visibilityState: DocumentVisibilityState = 'visible'
  const environmentDocument = new EventTarget() as Document
  Object.defineProperty(environmentDocument, 'visibilityState', {
    configurable: true,
    get: () => visibilityState,
  })

  return {
    document: environmentDocument,
    setVisibility(nextVisibility: DocumentVisibilityState) {
      visibilityState = nextVisibility
      environmentDocument.dispatchEvent(new Event('visibilitychange'))
    },
  }
}

function wakeLockSentinel() {
  let onRelease: (() => void) | undefined
  return {
    sentinel: {
      addEventListener: vi.fn((_event: 'release', listener: () => void) => {
        onRelease = listener
      }),
      release: vi.fn().mockResolvedValue(undefined),
    },
    releaseFromBrowser() {
      onRelease?.()
    },
  }
}

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

test('reports a localized audio failure state without blocking a focus session', async () => {
  const audio = {
    select: vi.fn().mockResolvedValue(undefined),
    setVolume: vi.fn(),
    start: vi.fn().mockResolvedValue('blocked'),
    stop: vi.fn(),
  }
  const data = loadAppData(localStorage)
  data.settings.selectedSound = 'rain'
  saveAppData(localStorage, data)
  const { result } = renderHook(() => usePomodoroController({ audio }))

  await act(async () => {
    await result.current.start()
  })

  expect(result.current.view.phase).toBe('focus')
  expect(result.current.audioStatus).toBe('blocked')
})

test('activates resources after a user start in React Strict Mode', async () => {
  const audio = { start: vi.fn().mockResolvedValue('playing'), stop: vi.fn() }
  const wakeLock = { acquire: vi.fn().mockResolvedValue('active'), release: vi.fn().mockResolvedValue(undefined) }
  const data = loadAppData(localStorage)
  data.settings.keepScreenAwake = true
  data.settings.selectedSound = 'rain'
  saveAppData(localStorage, data)
  const { result } = renderHook(() => usePomodoroController({ audio, wakeLock }), {
    wrapper: ({ children }) => <StrictMode>{children}</StrictMode>,
  })

  await act(async () => {
    await result.current.start()
  })

  expect(audio.start).toHaveBeenCalledOnce()
  expect(wakeLock.acquire).toHaveBeenCalledOnce()
  expect(result.current.wakeLockStatus).toBe('active')
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

test('persists task edits for an active session', async () => {
  const data = loadAppData(localStorage)
  data.activeSession = startSession(0, data.settings, 'Math')
  saveAppData(localStorage, data)
  const { result } = renderHook(() => usePomodoroController({ now: () => 1_000 }))

  await act(async () => {
    result.current.setTaskName('Science')
  })

  expect(loadAppData(localStorage).activeSession).toMatchObject({ taskName: 'Science' })
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
    history: [{ phase: 'focus', durationMinutes: 24 }],
  })
  expect(audio.stop).toHaveBeenCalledTimes(1)
  expect(wakeLock.release).toHaveBeenCalledTimes(1)
})

test('waits for an explicit resume after an elapsed phase when automatic transitions are disabled', async () => {
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

  expect(result.current.view.phase).toBe('paused')
  expect(loadAppData(localStorage).activeSession).toMatchObject({
    phase: 'paused',
    pausedPhase: 'shortBreak',
  })
  expect(wakeLock.release).toHaveBeenCalledTimes(1)
  vi.useRealTimers()
})

test('uses one real Wake Lock visibility owner and releases the returned sentinel', async () => {
  const environment = visibilityDocument()
  const first = wakeLockSentinel()
  const returned = wakeLockSentinel()
  const secondRequest = deferred<typeof returned.sentinel>()
  const request = vi
    .fn()
    .mockResolvedValueOnce(first.sentinel)
    .mockImplementationOnce(() => secondRequest.promise)
  const wakeLock = new WakeLockController({
    navigator: { wakeLock: { request } } as unknown as Navigator,
    document: environment.document,
  })
  const data = loadAppData(localStorage)
  data.settings.keepScreenAwake = true
  saveAppData(localStorage, data)
  const { result, unmount } = renderHook(() =>
    usePomodoroController({ document: environment.document, wakeLock }),
  )

  await act(async () => {
    await result.current.start()
  })
  first.releaseFromBrowser()
  environment.setVisibility('hidden')
  environment.setVisibility('visible')

  expect(request).toHaveBeenCalledTimes(2)

  await act(async () => {
    secondRequest.resolve(returned.sentinel)
    await Promise.resolve()
  })
  unmount()
  await act(async () => {
    await Promise.resolve()
  })

  expect(returned.sentinel.release).toHaveBeenCalledOnce()
})

test.each([
  ['pause', (controller: ReturnType<typeof usePomodoroController>) => controller.pause()],
  ['completion', (controller: ReturnType<typeof usePomodoroController>) => controller.finishCurrentPhase()],
] as const)('keeps resources released when delayed activation resolves after %s', async (_actionName, action) => {
  const environment = visibilityDocument()
  const pendingRequest = deferred<ReturnType<typeof wakeLockSentinel>['sentinel']>()
  const sentinel = wakeLockSentinel()
  const request = vi.fn().mockImplementation(() => pendingRequest.promise)
  const wakeLock = new WakeLockController({
    navigator: { wakeLock: { request } } as unknown as Navigator,
    document: environment.document,
  })
  const audio = { start: vi.fn().mockResolvedValue('playing'), stop: vi.fn() }
  const data = loadAppData(localStorage)
  data.settings.keepScreenAwake = true
  saveAppData(localStorage, data)
  const { result } = renderHook(() =>
    usePomodoroController({ audio, document: environment.document, wakeLock }),
  )

  let activation!: Promise<void>
  await act(async () => {
    activation = result.current.start()
    await Promise.resolve()
  })
  expect(request).toHaveBeenCalledOnce()

  const transition = action(result.current)
  await act(async () => {
    pendingRequest.resolve(sentinel.sentinel)
    await Promise.all([activation, transition])
  })

  expect(audio.stop).toHaveBeenCalled()
  expect(sentinel.sentinel.release).toHaveBeenCalledOnce()
  expect(result.current.wakeLockStatus).toBe('idle')
})

test.each([
  ['pause', (controller: ReturnType<typeof usePomodoroController>) => controller.pause()],
  ['completion', (controller: ReturnType<typeof usePomodoroController>) => controller.finishCurrentPhase()],
  ['unmount', undefined],
] as const)('stops delayed audio activation after %s', async (_actionName, action) => {
  const playback = deferred<string>()
  const audio = {
    select: vi.fn().mockResolvedValue(undefined),
    start: vi.fn().mockImplementation(() => playback.promise),
    stop: vi.fn(),
  }
  const data = loadAppData(localStorage)
  data.settings.selectedSound = 'rain'
  saveAppData(localStorage, data)
  const { result, unmount } = renderHook(() => usePomodoroController({ audio }))

  let activation!: Promise<void>
  await act(async () => {
    activation = result.current.start()
    await Promise.resolve()
    await Promise.resolve()
  })
  expect(audio.start).toHaveBeenCalledOnce()

  const transition = action ? action(result.current) : undefined
  if (!action) unmount()
  await act(async () => {
    playback.resolve('playing')
    await Promise.all([activation, transition])
  })

  expect(audio.stop).toHaveBeenCalled()
})

test('releases resources when delayed activation resolves after unmount', async () => {
  const environment = visibilityDocument()
  const pendingRequest = deferred<ReturnType<typeof wakeLockSentinel>['sentinel']>()
  const sentinel = wakeLockSentinel()
  const request = vi.fn().mockImplementation(() => pendingRequest.promise)
  const wakeLock = new WakeLockController({
    navigator: { wakeLock: { request } } as unknown as Navigator,
    document: environment.document,
  })
  const audio = { start: vi.fn().mockResolvedValue('playing'), stop: vi.fn() }
  const data = loadAppData(localStorage)
  data.settings.keepScreenAwake = true
  saveAppData(localStorage, data)
  const { result, unmount } = renderHook(() =>
    usePomodoroController({ audio, document: environment.document, wakeLock }),
  )

  let activation!: Promise<void>
  await act(async () => {
    activation = result.current.start()
    await Promise.resolve()
  })
  unmount()
  await act(async () => {
    pendingRequest.resolve(sentinel.sentinel)
    await activation
  })

  expect(audio.stop).toHaveBeenCalled()
  expect(sentinel.sentinel.release).toHaveBeenCalledOnce()
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
