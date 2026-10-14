import { AudioWaveform, CloudRain, Trees, Volume2, VolumeX, Waves } from 'lucide-react'
import type { SoundId } from '../../domain/types'
import { useTranslation } from '../../i18n/useTranslation'
import type { PomodoroController } from './usePomodoroController'

type QuickSoundId = Extract<SoundId, 'brownNoise' | 'forestRain' | 'ocean' | 'nightForest'>

const soundOptions: ReadonlyArray<{ id: QuickSoundId; icon: typeof AudioWaveform }> = [
  { id: 'brownNoise', icon: AudioWaveform },
  { id: 'forestRain', icon: CloudRain },
  { id: 'ocean', icon: Waves },
  { id: 'nightForest', icon: Trees },
]

interface TabletRoutinePanelProps {
  controller: PomodoroController
  roundsBeforeLongBreak: number
}

export function TabletRoutinePanel({ controller, roundsBeforeLongBreak }: TabletRoutinePanelProps) {
  const { t } = useTranslation(controller.locale)
  const SoundIcon = controller.soundEnabled ? Volume2 : VolumeX
  const selectedSound = soundOptions.some(({ id }) => id === controller.selectedSound)
    ? controller.selectedSound as QuickSoundId
    : 'forestRain'

  return (
    <aside className="tablet-routine" aria-label={t('tablet.routine.title')}>
      <section className="tablet-routine__sound">
        <h2>{t('settings.soundChoice')}</h2>
        <button type="button" className="tablet-routine__mute" onClick={controller.toggleSound}>
          <SoundIcon aria-hidden size={19} strokeWidth={2} />
          <span>{t(controller.soundEnabled ? 'timer.soundOff' : 'timer.soundOn')}</span>
        </button>
        <div className="tablet-routine__sounds">
          {soundOptions.map(({ id, icon: Icon }) => {
            const selected = controller.soundEnabled && selectedSound === id
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                className={selected ? 'tablet-routine__sound-option tablet-routine__sound-option--active' : 'tablet-routine__sound-option'}
                onClick={() => controller.selectSound(id)}
              >
                <Icon aria-hidden size={19} strokeWidth={2} />
                <span>{t(`settings.sound.${id}`)}</span>
              </button>
            )
          })}
        </div>
      </section>
      <section className="tablet-routine__rhythm">
        <h2>{t('tablet.routine.title')}</h2>
        <p>{t('tablet.routine.description')}</p>
        <div className="tablet-routine__rounds" aria-label={t('tablet.routine.rounds', { count: roundsBeforeLongBreak })}>
          {Array.from({ length: roundsBeforeLongBreak }, (_, index) => (
            <span key={index} data-testid="tablet-round" className={index < controller.view.completedFocusRounds ? 'tablet-routine__round--complete' : undefined} />
          ))}
        </div>
      </section>
    </aside>
  )
}
