import { BookOpen, Cat, Settings, Timer } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Locale } from '../domain/types'
import { useTranslation } from '../i18n/useTranslation'

export type NavigationSection = 'timer' | 'stats' | 'settings' | 'advice'

interface BottomNavProps {
  active: NavigationSection
  locale: Locale
  onChange(section: NavigationSection): void
}

const navigationSections: NavigationSection[] = ['timer', 'stats', 'advice', 'settings']

const navigationIcons: Record<NavigationSection, LucideIcon> = {
  timer: Timer,
  stats: Cat,
  advice: BookOpen,
  settings: Settings,
}

function NavigationIcon({ section }: { section: NavigationSection }) {
  const Icon = navigationIcons[section]

  return <Icon aria-hidden className="bottom-nav__icon" data-testid={`nav-icon-${section}`} size={22} strokeWidth={1.8} />
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
