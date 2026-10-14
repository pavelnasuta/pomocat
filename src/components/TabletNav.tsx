import { BookOpen, Settings, Timer } from 'lucide-react'
import type { Locale } from '../domain/types'
import { useTranslation } from '../i18n/useTranslation'
import type { NavigationSection } from './BottomNav'

interface TabletNavProps {
  active: NavigationSection
  locale: Locale
  onChange(section: NavigationSection): void
}

const tabletSections = [
  { section: 'timer' as const, icon: Timer },
  { section: 'advice' as const, icon: BookOpen },
  { section: 'settings' as const, icon: Settings },
]

export function TabletNav({ active, locale, onChange }: TabletNavProps) {
  const { t } = useTranslation(locale)

  return (
    <nav className="tablet-nav" aria-label={t('navigation.label')}>
      {tabletSections.map(({ section, icon: Icon }) => (
        <button
          key={section}
          type="button"
          aria-current={active === section ? 'page' : undefined}
          onClick={() => onChange(section)}
        >
          <Icon aria-hidden size={18} strokeWidth={1.9} />
          <span>{t(`navigation.${section}`)}</span>
        </button>
      ))}
    </nav>
  )
}
