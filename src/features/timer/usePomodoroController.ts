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
type WakeLockPort = Pick<WakeLockController, 'acquire' | 'reacquireWhenVisible' | 'release'>

export interface PomodoroController {
  locale: Locale
  animationsEnabled: boolean
  view: TimerView
  taskName: string
  wakeLockStatus: 'active' | 'unavailable' | 'idle'
  setTaskName(value: string): void
  start(): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  finishCurrentPhase(): Promise<void>
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
  const wakeLockWasUserActivated = useRef(false)
  const completionInFlight = useRef(false)

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
      if (visible && session?.phase === 'focus' && wakeLockWasUserActivated.current) {
        void wakeLock.reacquireWhenVisible().then(setWakeLockStatus)
      }
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

  useEffect(
    () => () => {
      audio.stop()
      void wakeLock.release()
    },
    [audio, wakeLock],
  )

  function persist(nextSession: ActiveSession | undefined, history = appData.history) {
    const nextAppData = { ...appData, activeSession: nextSession, history }
    saveAppData(storage, nextAppData)
    setAppData(nextAppData)
    options.onAppDataChange?.(nextAppData)
    setSession(nextSession)
    setClock(now())
  }

  async function activateResources(nextSession: ActiveSession) {
    if (appData.settings.selectedSound !== 'none') {
      await audio.select?.(appData.settings.selectedSound)
      audio.setVolume?.(appData.settings.soundVolume)
      await audio.start()
    }

    if (nextSession.phase === 'focus' && appData.settings.keepScreenAwake) {
      wakeLockWasUserActivated.current = true
      setWakeLockStatus(await wakeLock.acquire())
    }
  }

  async function releaseResources() {
    audio.stop()
    wakeLockWasUserActivated.current = false
    await wakeLock.release()
    setWakeLockStatus('idle')
  }

  function setTaskName(value: string) {
    setTaskNameState(value)
    if (session) persist({ ...session, taskName: value })
  }

  async function start() {
    const nextSession = startSession(now(), appData.settings, taskName || undefined)
    persist(nextSession)
    await activateResources(nextSession)
  }

  async function pause() {
    if (!isRunning(session)) return
    persist(pauseSession(session, now()))
    await releaseResources()
  }

  async function resume() {
    if (session?.phase !== 'paused') return
    const nextSession = resumeSession(session, now())
    persist(nextSession)
    if (isRunning(nextSession)) await activateResources(nextSession)
  }

  async function finishCurrentPhase() {
    if (!isRunning(session)) return
    const transition = completeCurrentPhase(session, appData.settings, now())
    persist(
      transition.nextSession,
      transition.historyItem ? [...appData.history, transition.historyItem] : appData.history,
    )
    await releaseResources()
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
    setTaskName,
    start,
    pause,
    resume,
    finishCurrentPhase,
  }
}
