import { useEffect, useRef, useState } from 'react'
import { loadAppData, saveAppData } from '../../data/storage'
import { AudioController } from '../../device/audio'
import { WakeLockController } from '../../device/wakeLock'
import {
  completeCurrentPhase,
  getTimerView,
  pauseSession,
  resumeSession,
  startSession,
  type TimerView,
} from '../../domain/timer'
import type { ActiveSession, AppData, Locale } from '../../domain/types'

type AudioPort = Pick<AudioController, 'start' | 'stop'> &
  Partial<Pick<AudioController, 'select' | 'setVolume'>>
type WakeLockPort = Pick<WakeLockController, 'acquire' | 'release'>

export interface PomodoroController {
  locale: Locale
  animationsEnabled: boolean
  view: TimerView
  taskName: string
  wakeLockStatus: 'active' | 'unavailable' | 'idle'
  audioStatus: 'idle' | 'blocked'
  setTaskName(value: string): void
  start(): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  finishCurrentPhase(): Promise<void>
  reset(): Promise<void>
}

interface PomodoroControllerOptions {
  now?: () => number
  storage?: Storage
  document?: Document
  audio?: AudioPort
  wakeLock?: WakeLockPort
  appData?: AppData
  onAppDataChange?(data: AppData): void
}

function idleView(): TimerView {
  return {
    phase: 'idle',
    remainingMs: 0,
    totalMs: 0,
    completedFocusRounds: 0,
    isFinished: false,
  }
}

function isRunning(session: ActiveSession | undefined): session is ActiveSession {
  return session !== undefined && session.phase !== 'paused' && session.phase !== 'idle'
}

export function usePomodoroController(options: PomodoroControllerOptions = {}): PomodoroController {
  const storage = options.storage ?? localStorage
  const environmentDocument = options.document ?? document
  const now = options.now ?? Date.now
  const audio = useRef<AudioPort>(options.audio ?? new AudioController()).current
  const wakeLock = useRef<WakeLockPort>(
    options.wakeLock ?? new WakeLockController({ navigator, document: environmentDocument }),
  ).current
  const [appData, setAppData] = useState(() => options.appData ?? loadAppData(storage))
  const [session, setSession] = useState<ActiveSession | undefined>(() => appData.activeSession)
  const [taskName, setTaskNameState] = useState(() => appData.activeSession?.taskName ?? '')
  const [clock, setClock] = useState(() => now())
  const [isVisible, setIsVisible] = useState(() => environmentDocument.visibilityState === 'visible')
  const [wakeLockStatus, setWakeLockStatus] = useState<'active' | 'unavailable' | 'idle'>('idle')
  const [audioStatus, setAudioStatus] = useState<'idle' | 'blocked'>('idle')
  const completionInFlight = useRef(false)
  const activationOperation = useRef(0)
  const mounted = useRef(true)
  const resourceQueue = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    if (!options.appData) return
    setAppData(options.appData)
    setSession(options.appData.activeSession)
    setTaskNameState(options.appData.activeSession?.taskName ?? '')
  }, [options.appData])

  useEffect(() => {
    function handleVisibilityChange() {
      const visible = environmentDocument.visibilityState === 'visible'
      setIsVisible(visible)
      if (visible && isRunning(session)) setClock(now())
    }

    environmentDocument.addEventListener('visibilitychange', handleVisibilityChange)
    return () => environmentDocument.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [environmentDocument, now, session, wakeLock])

  useEffect(() => {
    if (!isVisible || !isRunning(session)) return

    const interval = window.setInterval(() => setClock(now()), 250)
    return () => window.clearInterval(interval)
  }, [isVisible, now, session])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      invalidateActivation()
      audio.stop()
      void wakeLock.release()
    }
  }, [audio, wakeLock])

  function persist(nextSession: ActiveSession | undefined, history = appData.history) {
    const nextAppData = { ...appData, activeSession: nextSession, history }
    saveAppData(storage, nextAppData)
    setAppData(nextAppData)
    options.onAppDataChange?.(nextAppData)
    setSession(nextSession)
    setClock(now())
  }

  function queueResourceTransition(transition: () => Promise<void>): Promise<void> {
    const queuedTransition = resourceQueue.current.then(transition, transition)
    resourceQueue.current = queuedTransition.then(
      () => undefined,
      () => undefined,
    )
    return queuedTransition
  }

  function invalidateActivation() {
    activationOperation.current += 1
  }

  function isCurrentActivation(operation: number) {
    return mounted.current && activationOperation.current === operation
  }

  async function activateResources(nextSession: ActiveSession, operation: number) {
    if (appData.settings.selectedSound !== 'none') {
      try {
        await audio.select?.(appData.settings.selectedSound)
        if (!isCurrentActivation(operation)) return
        audio.setVolume?.(appData.settings.soundVolume)
        const playback = await audio.start()
        if (!isCurrentActivation(operation)) {
          audio.stop()
          return
        }
        setAudioStatus(playback === 'blocked' ? 'blocked' : 'idle')
      } catch {
        if (isCurrentActivation(operation)) setAudioStatus('blocked')
      }
    }

    if (nextSession.phase === 'focus' && appData.settings.keepScreenAwake) {
      if (!isCurrentActivation(operation)) return
      const status = await wakeLock.acquire()
      if (!isCurrentActivation(operation)) {
        await wakeLock.release()
        return
      }
      setWakeLockStatus(status)
    }
  }

  async function releaseResources() {
    audio.stop()
    await wakeLock.release()
    if (mounted.current) setWakeLockStatus('idle')
  }

  function setTaskName(value: string) {
    setTaskNameState(value)
    if (session) persist({ ...session, taskName: value })
  }

  async function start() {
    const nextSession = startSession(now(), appData.settings, taskName || undefined)
    const operation = activationOperation.current + 1
    activationOperation.current = operation
    setAudioStatus('idle')
    persist(nextSession)
    await queueResourceTransition(() => activateResources(nextSession, operation))
  }

  async function pause() {
    if (!isRunning(session)) return
    invalidateActivation()
    persist(pauseSession(session, now()))
    await queueResourceTransition(releaseResources)
  }

  async function resume() {
    if (session?.phase !== 'paused') return
    const nextSession = resumeSession(session, now())
    const operation = activationOperation.current + 1
    activationOperation.current = operation
    persist(nextSession)
    if (isRunning(nextSession)) await queueResourceTransition(() => activateResources(nextSession, operation))
  }

  async function finishCurrentPhase() {
    if (!isRunning(session)) return
    invalidateActivation()
    const transition = completeCurrentPhase(session, appData.settings, now())
    persist(
      transition.nextSession,
      transition.historyItem ? [...appData.history, transition.historyItem] : appData.history,
    )
    await queueResourceTransition(releaseResources)
  }

  async function reset() {
    invalidateActivation()
    completionInFlight.current = false
    persist(undefined)
    setTaskNameState('')
    setAudioStatus('idle')
    await queueResourceTransition(releaseResources)
  }

  useEffect(() => {
    if (!isRunning(session) || !getTimerView(session, clock).isFinished || completionInFlight.current) return

    completionInFlight.current = true
    void finishCurrentPhase().finally(() => {
      completionInFlight.current = false
    })
  }, [clock, session])

  return {
    locale: appData.settings.locale,
    animationsEnabled: appData.settings.animationsEnabled,
    view: session ? getTimerView(session, clock) : idleView(),
    taskName,
    wakeLockStatus,
    audioStatus,
    setTaskName,
    start,
    pause,
    resume,
    finishCurrentPhase,
    reset,
  }
}
