import { useState } from 'react'
import { Cat, Share2 } from 'lucide-react'
import {
  getAllSessionCount,
  getDailyMinutes,
  getDailySessionCount,
  getMonthlyMinutes,
  getMonthlySessionCount,
  getWeeklyMinutes,
  getWeeklySessionCount,
} from '../../domain/stats'
import type { Locale, SessionHistoryItem } from '../../domain/types'
import { useTranslation } from '../../i18n/useTranslation'
import type { ThemeId } from '../../theme/themes'
import { createStatsShareImage, createStatsShareText, saveStatsShareCard } from './shareCard'

export interface TabletStatsPanelProps {
  history: SessionHistoryItem[]
  locale?: Locale
  childName?: string
  theme?: ThemeId
  now?: Date
}

export function TabletStatsPanel({
  history,
  locale = 'ru',
  childName = 'pomokitty',
  theme = 'terracotta',
  now = new Date(),
}: TabletStatsPanelProps) {
  const { t } = useTranslation(locale)
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'shared' | 'saved' | 'error'>('idle')
  const todayMinutes = Math.round(getDailyMinutes(history, now))
  const weekCats = getWeeklySessionCount(history, now)
  const monthMinutes = Math.round(getMonthlyMinutes(history, now))
  const todayCats = getDailySessionCount(history, now)
  const monthCats = getMonthlySessionCount(history, now)

  async function shareCats() {
    setShareStatus('sharing')
    const input = { childName, todayMinutes, weekMinutes: Math.round(getWeeklyMinutes(history, now)), cats: getAllSessionCount(history), locale, theme }
    const text = createStatsShareText(input)

    try {
      const image = await createStatsShareImage(input)
      const shareData = { title: 'pomokitty', text, files: [image] }
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData)
        setShareStatus('shared')
        return
      }
      await saveStatsShareCard(image, text)
      setShareStatus('saved')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setShareStatus('idle')
        return
      }
      setShareStatus('error')
    }
  }

  return (
    <aside className="tablet-stats" aria-label={t('tablet.stats.title')}>
      <h2>{t('tablet.stats.title')}</h2>
      <section className="tablet-stats__period" data-testid="tablet-stats-today">
        <h3>{t('stats.today')}</h3>
        <output>{t('stats.minutes', { minutes: todayMinutes })}</output>
        <p>{t('stats.cats', { count: todayCats })}</p>
      </section>
      <section className="tablet-stats__period tablet-stats__period--week" data-testid="tablet-stats-week">
        <h3>{t('stats.week')}</h3>
        <div className="tablet-stats__cats" aria-label={t('app.totalCats', { count: weekCats })}>
          {Array.from({ length: weekCats }, (_, index) => (
            <Cat key={index} aria-hidden data-testid="tablet-week-cat" size={28} strokeWidth={1.7} />
          ))}
        </div>
        <p>{t('stats.cats', { count: weekCats })}</p>
      </section>
      <section className="tablet-stats__period" data-testid="tablet-stats-month">
        <h3>{t('stats.month')}</h3>
        <output>{t('stats.minutes', { minutes: monthMinutes })}</output>
        <p>{t('stats.cats', { count: monthCats })}</p>
      </section>
      <div className="tablet-stats__share">
        <button type="button" onClick={shareCats} disabled={shareStatus === 'sharing'}>
          <Share2 aria-hidden size={17} strokeWidth={2} />
          {t('stats.share.action')}
        </button>
        {shareStatus !== 'idle' && <p role="status">{t(`stats.share.${shareStatus}`)}</p>}
      </div>
    </aside>
  )
}
