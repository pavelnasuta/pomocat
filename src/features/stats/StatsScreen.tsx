import { getDailyMinutes, getWeeklyMinutes } from '../../domain/stats'
import type { Locale, SessionHistoryItem } from '../../domain/types'
import { useTranslation } from '../../i18n/useTranslation'

export interface StatsScreenProps {
  history: SessionHistoryItem[]
  locale?: Locale
}

function formatMinutes(minutes: number, locale: Locale): string {
  return `${Math.round(minutes)} ${locale === 'ru' ? 'мин' : 'min'}`
}

function formatCompletedAt(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function historyLabel(phase: SessionHistoryItem['phase'], locale: Locale): string {
  if (phase === 'focus') return locale === 'ru' ? 'Фокус' : 'Focus'
  if (phase === 'shortBreak') return locale === 'ru' ? 'Короткий перерыв' : 'Short break'
  return locale === 'ru' ? 'Длинный перерыв' : 'Long break'
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
          <output>{formatMinutes(getDailyMinutes(history, now), locale)}</output>
        </article>
        <article className="stats-screen__total" data-testid="stats-week">
          <h2>{t('stats.week')}</h2>
          <output>{formatMinutes(getWeeklyMinutes(history, now), locale)}</output>
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
                <span>{historyLabel(item.phase, locale)}</span>
                <span>{formatMinutes(item.durationMinutes, locale)}</span>
                <time dateTime={item.completedAt}>{formatCompletedAt(item.completedAt, locale)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
