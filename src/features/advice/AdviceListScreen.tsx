import { ChevronRight } from 'lucide-react'
import type { Locale } from '../../domain/types'
import { useTranslation } from '../../i18n/useTranslation'

import { articleIds, type AdviceArticleId } from './articles'

interface AdviceListScreenProps {
  locale: Locale
  onOpen(article: AdviceArticleId): void
}

export function AdviceListScreen({ locale, onOpen }: AdviceListScreenProps) {
  const { t } = useTranslation(locale)

  return (
    <section className="advice-list" aria-labelledby="advice-list-title">
      <header className="advice-list__intro">
        <p>{t('advice.eyebrow')}</p>
        <h2 id="advice-list-title">{t('advice.title')}</h2>
        <span>{t('advice.description')}</span>
      </header>

      <ul className="advice-list__articles" aria-label={t('advice.articlesLabel')}>
        {articleIds.map((article) => (
          <li key={article}>
            <button
              type="button"
              className="advice-list__article-button"
              aria-label={t(`advice.${article}.title`)}
              onClick={() => onOpen(article)}
            >
              <article>
                <h3>{t(`advice.${article}.title`)}</h3>
                <p>{t(`advice.${article}.summary`)}</p>
              </article>
              <ChevronRight aria-hidden className="advice-list__chevron" size={22} strokeWidth={2} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
