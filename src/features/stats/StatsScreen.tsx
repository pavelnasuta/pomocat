import { Cat } from 'lucide-react'
import {
  getAllSessionCount,
  getDailyMinutes,
  getMonthlySessionCount,
  getWeeklyMinutes,
  getWeeklySessionCount,
} from '../../domain/stats'
import type { Locale, SessionHistoryItem } from '../../domain/types'
import { useTranslation } from '../../i18n/useTranslation'

type Translate = ReturnType<typeof useTranslation>['t']

export interface StatsScreenProps {
  history: SessionHistoryItem[]
  locale?: Locale
}

function formatMinutes(minutes: number, t: Translate): string {
  return t('stats.minutes', { minutes: Math.round(minutes) })
}

interface SessionCountTileProps {
  count: number
  label: 'all' | 'week' | 'month'
  t: Translate
}

function SessionCountTile({ count, label, t }: SessionCountTileProps) {
  return (
    <article className="stats-screen__session-count" data-testid={`stats-sessions-${label}`}>
      <h2>{t(`stats.completed.${label}`)}</h2>
      <output>{count}</output>
      <div className="stats-screen__cats" aria-label={`${count} ${t('stats.completed.all').toLocaleLowerCase()}`}>
        {Array.from({ length: count }, (_, index) => (
          <Cat key={index} aria-hidden data-testid="stats-session-cat" size={26} strokeWidth={1.8} />
        ))}
      </div>
    </article>
  )
}

export function StatsScreen({ history, locale = 'ru' }: StatsScreenProps) {
  const { t } = useTranslation(locale)
  const now = new Date()

  return (
    <section className="stats-screen" aria-label={t('navigation.stats')}>
      <div className="stats-screen__totals">
        <article className="stats-screen__total" data-testid="stats-today">
          <h2>{t('stats.today')}</h2>
          <output>{formatMinutes(getDailyMinutes(history, now), t)}</output>
        </article>
        <article className="stats-screen__total" data-testid="stats-week">
          <h2>{t('stats.week')}</h2>
          <output>{formatMinutes(getWeeklyMinutes(history, now), t)}</output>
        </article>
      </div>

      <section className="stats-screen__sessions" aria-label={t('stats.completed.all')}>
        <SessionCountTile count={getWeeklySessionCount(history, now)} label="week" t={t} />
        <SessionCountTile count={getMonthlySessionCount(history, now)} label="month" t={t} />
        <SessionCountTile count={getAllSessionCount(history)} label="all" t={t} />
      </section>
    </section>
  )
}
