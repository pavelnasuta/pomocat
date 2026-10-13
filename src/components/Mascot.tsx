import type { Locale } from '../domain/types'
import breakCat from '../assets/mascot/break.png'
import celebrateCat from '../assets/mascot/celebrate.png'
import focusCat from '../assets/mascot/focus.png'
import pauseCat from '../assets/mascot/pause.png'
import sleepCat from '../assets/mascot/sleep.png'
import type { ThemeId } from '../theme/themes'
import { useTranslation } from '../i18n/useTranslation'

export type MascotPose = 'rest' | 'work' | 'pause' | 'stretch' | 'sleep' | 'celebrate'

interface MascotProps {
  active: boolean
  animationsEnabled: boolean
  locale: Locale
  pose?: MascotPose
  theme?: ThemeId
}

const mascotImages: Record<MascotPose, string> = {
  rest: pauseCat,
  work: focusCat,
  pause: pauseCat,
  stretch: breakCat,
  sleep: sleepCat,
  celebrate: celebrateCat,
}

const themedMascotImages = import.meta.glob('../assets/mascot/{lavender,sea-glass,sunny,blueberry}-*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const themeAssetPrefix: Partial<Record<ThemeId, string>> = {
  lavender: 'lavender',
  seaGlass: 'sea-glass',
  sunny: 'sunny',
  blueberry: 'blueberry',
}

const poseAssetName: Record<MascotPose, string> = {
  rest: 'pause',
  work: 'focus',
  pause: 'pause',
  stretch: 'break',
  sleep: 'sleep',
  celebrate: 'celebrate',
}

export function Mascot({ active, animationsEnabled, locale, pose = 'rest', theme = 'terracotta' }: MascotProps) {
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
      <img
        className="mascot__image"
        src={theme === 'terracotta' ? mascotImages[pose] : themedMascotImages[`../assets/mascot/${themeAssetPrefix[theme]}-${poseAssetName[pose]}.png`]}
        alt=""
        draggable={false}
      />
    </div>
  )
}
