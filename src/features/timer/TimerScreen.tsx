import { Check, Pause, Play } from 'lucide-react'
import { Mascot, type MascotPose } from '../../components/Mascot'
import { useTranslation } from '../../i18n/useTranslation'
import type { PomodoroController } from './usePomodoroController'

interface TimerScreenProps {
  controller: PomodoroController
}

function formatRemainingTime(remainingMs: number): string {
  const remainingSeconds = Math.ceil(remainingMs / 1_000)
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function progressPercent(remainingMs: number, totalMs: number): number {
  if (totalMs <= 0) return 0
  return Math.round(Math.min(1, Math.max(0, 1 - remainingMs / totalMs)) * 100)
}

function mascotPose(controller: PomodoroController): MascotPose {
  if (controller.view.isFinished) return 'celebrate'
  if (controller.view.phase === 'focus') return 'work'
  if (controller.view.phase === 'shortBreak') return 'stretch'
  if (controller.view.phase === 'longBreak') return 'sleep'
  if (controller.view.phase === 'paused') return 'pause'
  return 'rest'
}

export function TimerScreen({ controller }: TimerScreenProps) {
  const { t } = useTranslation(controller.locale)
  const isActive =
    controller.view.phase === 'focus' ||
    controller.view.phase === 'shortBreak' ||
    controller.view.phase === 'longBreak'
  const progress = progressPercent(controller.view.remainingMs, controller.view.totalMs)
  const isRest = controller.view.phase === 'shortBreak' || controller.view.phase === 'longBreak'
  const phaseLabel = t(isRest ? 'timer.restTime' : 'timer.workTime')
  const isResettable = controller.view.phase !== 'idle'
  const PrimaryIcon = controller.view.phase === 'paused' || !isActive ? Play : Pause

  return (
    <section className="timer-screen" aria-label={t('navigation.timer')}>
      <header className="timer-screen__status">
        <p>{phaseLabel}</p>
        <output aria-live="polite">{formatRemainingTime(controller.view.remainingMs)}</output>
        <div
          className="timer-screen__progress"
          role="progressbar"
          aria-label={t('timer.progress')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <label className="timer-screen__task">
        <span>{t('timer.taskLabel')}</span>
        <input value={controller.taskName} onChange={(event) => controller.setTaskName(event.target.value)} />
      </label>

      <div className="timer-screen__actions">
        <Mascot
          active={controller.view.phase === 'focus'}
          animationsEnabled={controller.animationsEnabled}
          locale={controller.locale}
          pose={mascotPose(controller)}
        />
        {controller.wakeLockStatus === 'unavailable' && <p>{t('timer.wakeLockUnavailable')}</p>}
        {controller.audioStatus === 'blocked' && <p role="status">{t('timer.audioBlocked')}</p>}
        {isResettable && (
          <button type="button" className="timer-screen__reset" onClick={() => void controller.reset()}>
            <Check aria-hidden className="timer-screen__button-icon" size={20} strokeWidth={2} />
            <span>{t('timer.complete')}</span>
          </button>
        )}
      </div>

      <button
        type="button"
        className="timer-screen__primary"
        onClick={() => void (controller.view.phase === 'paused' ? controller.resume() : isActive ? controller.pause() : controller.start())}
      >
        <PrimaryIcon aria-hidden className="timer-screen__button-icon" size={20} strokeWidth={2} />
        <span>{controller.view.phase === 'paused' ? t('timer.resume') : isActive ? t('timer.pause') : t('timer.start')}</span>
      </button>
    </section>
  )
}
