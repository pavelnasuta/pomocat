import { loadAppData } from '../data/storage'
import { useTranslation } from '../i18n/useTranslation'

interface MascotProps {
  active: boolean
  animationsEnabled: boolean
}

export function Mascot({ active, animationsEnabled }: MascotProps) {
  const locale = loadAppData(localStorage).settings.locale
  const { t } = useTranslation(locale)
  const isAnimated = active && animationsEnabled

  return (
    <div
      className={`mascot${isAnimated ? ' mascot--active' : ''}`}
      data-testid="mascot"
      data-animated={String(isAnimated)}
      role="img"
      aria-label={t('mascot.label')}
    >
      <span className="mascot__tail" aria-hidden="true" />
      <span className="mascot__body" aria-hidden="true" />
      <span className="mascot__head" aria-hidden="true">
        <span className="mascot__ear mascot__ear--left" />
        <span className="mascot__ear mascot__ear--right" />
        <span className="mascot__face">
          <span className="mascot__eye mascot__eye--left" />
          <span className="mascot__eye mascot__eye--right" />
          <span className="mascot__nose" />
        </span>
      </span>
    </div>
  )
}
