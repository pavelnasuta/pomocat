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

function phaseLabel(phase: PomodoroController['view']['phase']): 'timer.focus' | 'timer.shortBreak' | 'timer.longBreak' {
  if (phase === 'shortBreak') return 'timer.shortBreak'
  if (phase === 'longBreak') return 'timer.longBreak'
  return 'timer.focus'
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
  const primaryAction =
    controller.view.phase === 'paused'
      ? { label: t('timer.resume'), action: controller.resume }
      : isActive
        ? { label: t('timer.pause'), action: controller.pause }
        : { label: t('timer.start'), action: controller.start }

  return (
    <section className="timer-screen" aria-label={t('navigation.timer')}>
      <header className="timer-screen__status">
        <p>{t(phaseLabel(controller.view.phase))}</p>
        <output aria-live="polite">{formatRemainingTime(controller.view.remainingMs)}</output>
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
        {isActive && (
          <button type="button" className="timer-screen__finish" onClick={() => void controller.finishCurrentPhase()}>
            {t('timer.finishPhase')}
          </button>
        )}
      </div>

      <button type="button" className="timer-screen__primary" onClick={() => void primaryAction.action()}>
        {primaryAction.label}
      </button>
    </section>
  )
}
