import type { Locale } from '../domain/types'
import breakCat from '../assets/mascot/break.png'
import celebrateCat from '../assets/mascot/celebrate.png'
import focusCat from '../assets/mascot/focus.png'
import pauseCat from '../assets/mascot/pause.png'
import sleepCat from '../assets/mascot/sleep.png'
import { useTranslation } from '../i18n/useTranslation'

export type MascotPose = 'rest' | 'work' | 'pause' | 'stretch' | 'sleep' | 'celebrate'

interface MascotProps {
  active: boolean
  animationsEnabled: boolean
  locale: Locale
  pose?: MascotPose
}

const mascotImages: Record<MascotPose, string> = {
  rest: pauseCat,
  work: focusCat,
  pause: pauseCat,
  stretch: breakCat,
  sleep: sleepCat,
  celebrate: celebrateCat,
}

export function Mascot({ active, animationsEnabled, locale, pose = 'rest' }: MascotProps) {
  const { t } = useTranslation(locale)
  const isAnimated = animationsEnabled && (active || pose === 'celebrate')

  return (
    <div
      className={`mascot mascot--${pose}${isAnimated ? ' mascot--active' : ''}`}
      data-testid="mascot"
      data-animated={String(isAnimated)}
      data-pose={pose}
      role="img"
      aria-label={t('mascot.label')}
    >
      <img className="mascot__image" src={mascotImages[pose]} alt="" draggable={false} />
    </div>
  )
}
