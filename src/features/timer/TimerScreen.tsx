import type { ReactNode } from 'react'
import { AudioWaveform, Check, CloudRain, Pause, Play, SkipForward, Trees, Volume2, VolumeX, Waves } from 'lucide-react'
import { Mascot, type MascotPose } from '../../components/Mascot'
import type { SoundId } from '../../domain/types'
import { useTranslation } from '../../i18n/useTranslation'
import type { ThemeId } from '../../theme/themes'
import type { PomodoroController } from './usePomodoroController'

interface TimerScreenProps {
  controller: PomodoroController
  theme?: ThemeId
  tabletStart?: ReactNode
  tabletEnd?: ReactNode
}

type QuickSoundId = Extract<SoundId, 'brownNoise' | 'forestRain' | 'ocean' | 'nightForest'>

const quickSoundOptions: ReadonlyArray<{ id: QuickSoundId; icon: typeof AudioWaveform }> = [
  { id: 'brownNoise', icon: AudioWaveform },
  { id: 'forestRain', icon: CloudRain },
  { id: 'ocean', icon: Waves },
  { id: 'nightForest', icon: Trees },
]

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

export function TimerScreen({ controller, theme = 'terracotta', tabletStart, tabletEnd }: TimerScreenProps) {
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
  const SoundIcon = controller.soundEnabled ? Volume2 : VolumeX
  const selectedQuickSound = quickSoundOptions.some(({ id }) => id === controller.selectedSound)
    ? controller.selectedSound as QuickSoundId
    : 'forestRain'

  return (
    <section className="timer-screen" aria-label={t('navigation.timer')}>
      <div className="timer-screen__tablet-layout">
        {tabletStart && <div className="timer-screen__tablet-sidebar timer-screen__tablet-sidebar--start">{tabletStart}</div>}
        <div className="timer-screen__core">
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
            <div className="timer-screen__sound-controls" role="group" aria-label={t('settings.soundChoice')}>
              <button
                type="button"
                className="timer-screen__sound-toggle"
                aria-label={t(controller.soundEnabled ? 'timer.soundOff' : 'timer.soundOn')}
                aria-pressed={controller.soundEnabled}
                onClick={controller.toggleSound}
              >
                <SoundIcon aria-hidden size={24} strokeWidth={2} />
              </button>
              <span className="timer-screen__sound-divider" aria-hidden />
              {quickSoundOptions.map(({ id, icon: Icon }) => {
                const isSelected = controller.soundEnabled && selectedQuickSound === id
                return (
                  <button
                    key={id}
                    type="button"
                    className={`timer-screen__sound-option${isSelected ? ' timer-screen__sound-option--active' : ''}`}
                    aria-label={t(`settings.sound.${id}`)}
                    aria-pressed={isSelected}
                    onClick={() => controller.selectSound(id)}
                  >
                    <Icon aria-hidden size={21} strokeWidth={2} />
                  </button>
                )
              })}
            </div>
          </header>

          <div className="timer-screen__actions">
            <Mascot
              active={controller.view.phase === 'focus'}
              animationsEnabled={controller.animationsEnabled}
              locale={controller.locale}
              pose={mascotPose(controller)}
              theme={theme}
            />
            {controller.wakeLockStatus === 'unavailable' && <p>{t('timer.wakeLockUnavailable')}</p>}
            {controller.audioStatus === 'blocked' && <p role="status">{t('timer.audioBlocked')}</p>}
          </div>

          <div className="timer-screen__controls">
            <button
              type="button"
              className="timer-screen__primary"
              onClick={() => void (controller.view.phase === 'paused' ? controller.resume() : isActive ? controller.pause() : controller.start())}
            >
              <PrimaryIcon aria-hidden className="timer-screen__button-icon" size={20} strokeWidth={2} />
              <span>{controller.view.phase === 'paused' ? t('timer.resume') : isActive ? t('timer.pause') : t('timer.start')}</span>
            </button>
            {isResettable && (
              <div className="timer-screen__secondary-actions">
                <button
                  type="button"
                  className="timer-screen__skip"
                  disabled={!isActive}
                  onClick={() => void controller.skip()}
                >
                  <SkipForward aria-hidden className="timer-screen__button-icon" size={18} strokeWidth={2} />
                  <span>{t('timer.skip')}</span>
                </button>
                <button type="button" className="timer-screen__reset" onClick={() => void controller.reset()}>
                  <Check aria-hidden className="timer-screen__button-icon" size={18} strokeWidth={2} />
                  <span>{t('timer.complete')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
        {tabletEnd && <div className="timer-screen__tablet-sidebar timer-screen__tablet-sidebar--end">{tabletEnd}</div>}
      </div>
    </section>
  )
}
