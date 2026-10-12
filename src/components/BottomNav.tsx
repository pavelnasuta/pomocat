import type { Locale } from '../domain/types'
import { useTranslation } from '../i18n/useTranslation'

export type NavigationSection = 'timer' | 'stats' | 'settings'

interface BottomNavProps {
  active: NavigationSection
  locale: Locale
  onChange(section: NavigationSection): void
}

const navigationSections: NavigationSection[] = ['timer', 'stats', 'settings']

function NavigationIcon({ section }: { section: NavigationSection }) {
  const commonProps = {
    'aria-hidden': true,
    className: 'bottom-nav__icon',
    'data-testid': `nav-icon-${section}`,
    fill: 'none',
    viewBox: '0 0 24 24',
  }

  if (section === 'timer') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="13" r="7.5" />
        <path d="M12 9v4l2.5 1.5M9 2h6M12 5.5V2" />
      </svg>
    )
  }

  if (section === 'stats') {
    return (
      <svg {...commonProps}>
        <path d="M4 20V11M10 20V4M16 20v-6M2 20h20" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06A1.7 1.7 0 0 0 15.74 18a1.7 1.7 0 0 0-1.04 1.56V20h-3v-.44A1.7 1.7 0 0 0 10.66 18a1.7 1.7 0 0 0-1.88.34l-.06.06L6.6 16.28l.06-.06A1.7 1.7 0 0 0 7 14.34 1.7 1.7 0 0 0 5.44 13.3H5v-3h.44A1.7 1.7 0 0 0 7 9.26a1.7 1.7 0 0 0-.34-1.88L6.6 7.32 8.72 5.2l.06.06A1.7 1.7 0 0 0 10.66 5a1.7 1.7 0 0 0 1.04-1.56V3h3v.44A1.7 1.7 0 0 0 15.74 5a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06A1.7 1.7 0 0 0 19.4 8.66a1.7 1.7 0 0 0 1.56 1.04H21v3h-.04a1.7 1.7 0 0 0-1.56 1.04Z" />
    </svg>
  )
}

export function BottomNav({ active, locale, onChange }: BottomNavProps) {
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
          <NavigationIcon section={section} />
          <span className="bottom-nav__label">{t(`navigation.${section}`)}</span>
        </button>
      ))}
    </nav>
  )
}
