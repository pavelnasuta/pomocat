import { useState } from 'react'
import { Cat, Share2 } from 'lucide-react'
import {
  getAllSessionCount,
  getDailyMinutes,
  getMonthlySessionCount,
  getWeeklyMinutes,
  getWeeklySessionCount,
} from '../../domain/stats'
import type { Locale, SessionHistoryItem } from '../../domain/types'
import { useTranslation } from '../../i18n/useTranslation'
import type { ThemeId } from '../../theme/themes'
import { createStatsShareImage, createStatsShareText, saveStatsShareCard } from './shareCard'

type Translate = ReturnType<typeof useTranslation>['t']

export interface StatsScreenProps {
  history: SessionHistoryItem[]
  locale?: Locale
  childName?: string
  theme?: ThemeId
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

export function StatsScreen({ history, locale = 'ru', childName = 'pomokitty', theme = 'terracotta' }: StatsScreenProps) {
  const { t } = useTranslation(locale)
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'shared' | 'saved' | 'error'>('idle')
  const now = new Date()
  const todayMinutes = Math.round(getDailyMinutes(history, now))
  const weekMinutes = Math.round(getWeeklyMinutes(history, now))
  const cats = getAllSessionCount(history)

  async function shareCats() {
    setShareStatus('sharing')
    const input = { childName, todayMinutes, weekMinutes, cats, locale, theme }
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
    <section className="stats-screen" aria-label={t('navigation.stats')}>
      <div className="stats-screen__totals">
        <article className="stats-screen__total" data-testid="stats-today">
          <h2>{t('stats.today')}</h2>
          <output>{formatMinutes(todayMinutes, t)}</output>
        </article>
        <article className="stats-screen__total" data-testid="stats-week">
          <h2>{t('stats.week')}</h2>
          <output>{formatMinutes(weekMinutes, t)}</output>
        </article>
      </div>

      <div className="stats-screen__share">
        <button type="button" onClick={shareCats} disabled={shareStatus === 'sharing'}>
          <Share2 aria-hidden size={18} strokeWidth={2} />
          {t('stats.share.action')}
        </button>
        {shareStatus !== 'idle' && <p role="status">{t(`stats.share.${shareStatus}`)}</p>}
      </div>

      <section className="stats-screen__sessions" aria-label={t('stats.completed.all')}>
        <SessionCountTile count={getWeeklySessionCount(history, now)} label="week" t={t} />
        <SessionCountTile count={getMonthlySessionCount(history, now)} label="month" t={t} />
        <SessionCountTile count={getAllSessionCount(history)} label="all" t={t} />
      </section>
    </section>
  )
}
