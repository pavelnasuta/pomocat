import type { Locale } from '../domain/types'
import { useTranslation } from '../i18n/useTranslation'

export type MascotPose = 'rest' | 'work' | 'pause' | 'stretch' | 'celebrate'

interface MascotProps {
  active: boolean
  animationsEnabled: boolean
  locale: Locale
  pose?: MascotPose
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
      <svg viewBox="0 0 180 160" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <g className="mascot__body">
          <path d="M53 88c-11 14-12 39 1 52 12 12 53 12 68-1 11-10 10-36-1-51" />
          <path d="M70 101c6 4 32 4 40 0" className="mascot__belly" />
        </g>
        <g className="mascot__tail">
          <path d="M119 119c19 7 30-2 29-16-1-13-14-17-23-10" />
        </g>
        <g className="mascot__head">
          <path d="M48 84c-9-12-10-31-6-52l20 15c10-5 25-5 36 0l20-15c4 21 3 40-6 52-9 12-55 12-64 0Z" />
          <g className="mascot__eyes">
            <circle cx="68" cy="65" r="3" />
            <circle cx="92" cy="65" r="3" />
          </g>
          <path d="M77 76c3 3 7 3 10 0" className="mascot__mouth" />
        </g>
        <g className="mascot__paws">
          {pose === 'stretch' ? (
            <>
              <path d="M68 118c-14-7-20-19-14-31" />
              <path d="M105 118c14-7 20-19 14-31" />
            </>
          ) : (
            <>
              <path d="M67 116c5-3 12-3 17 0" />
              <path d="M95 116c5-3 12-3 17 0" />
            </>
          )}
        </g>
        {pose === 'work' && (
          <g className="mascot__notebook">
            <path d="M67 105c7-4 15-4 22 1v20c-7-5-15-5-22-1v-20Z" />
            <path d="M89 106c7-5 15-5 22-1v20c-7-4-15-4-22 1v-20Z" />
            <path d="m105 96 7 7" className="mascot__pencil" />
          </g>
        )}
        {pose === 'celebrate' && <path d="M49 93 40 82M118 92l10-11" className="mascot__spark" />}
      </svg>
    </div>
  )
}
