import { getDailyMinutes, getWeeklyMinutes } from '../../domain/stats'
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

function formatCompletedAt(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function historyLabel(phase: SessionHistoryItem['phase'], t: Translate): string {
  if (phase === 'focus') return t('stats.phase.focus')
  if (phase === 'shortBreak') return t('stats.phase.shortBreak')
  return t('stats.phase.longBreak')
}

export function StatsScreen({ history, locale = 'ru' }: StatsScreenProps) {
  const { t } = useTranslation(locale)
  const now = new Date()
  const orderedHistory = [...history].sort(
    (first, second) => new Date(second.completedAt).getTime() - new Date(first.completedAt).getTime(),
  )

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

      <section className="stats-screen__history" aria-labelledby="stats-history-title">
        <h2 id="stats-history-title">{t('stats.history')}</h2>
        {orderedHistory.length === 0 ? (
          <p>{t('stats.empty')}</p>
        ) : (
          <ul aria-label={t('stats.history')}>
            {orderedHistory.map((item) => (
              <li key={item.id}>
                <span>{historyLabel(item.phase, t)}</span>
                <span>{formatMinutes(item.durationMinutes, t)}</span>
                <time dateTime={item.completedAt}>{formatCompletedAt(item.completedAt, locale)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
