import { loadAppData } from '../data/storage'
import { useTranslation } from '../i18n/useTranslation'

export type NavigationSection = 'timer' | 'stats' | 'settings'

interface BottomNavProps {
  active: NavigationSection
  onChange(section: NavigationSection): void
}

const navigationSections: NavigationSection[] = ['timer', 'stats', 'settings']

export function BottomNav({ active, onChange }: BottomNavProps) {
  const locale = loadAppData(localStorage).settings.locale
  const { t } = useTranslation(locale)

  return (
    <nav className="bottom-nav" aria-label={t('navigation.label')}>
      {navigationSections.map((section) => (
        <button
          key={section}
          type="button"
          className="bottom-nav__button"
          aria-current={active === section ? 'page' : undefined}
          onClick={() => onChange(section)}
        >
          {t(`navigation.${section}`)}
        </button>
      ))}
    </nav>
  )
}
