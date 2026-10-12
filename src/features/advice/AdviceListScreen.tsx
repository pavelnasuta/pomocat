import type { Locale } from '../../domain/types'
import { useTranslation } from '../../i18n/useTranslation'

const articleKeys = ['start', 'smallSteps', 'breaks', 'distractions', 'motivation'] as const

export function AdviceListScreen({ locale }: { locale: Locale }) {
  const { t } = useTranslation(locale)

  return (
    <section className="advice-list" aria-labelledby="advice-list-title">
      <header className="advice-list__intro">
        <p>{t('advice.eyebrow')}</p>
        <h2 id="advice-list-title">{t('advice.title')}</h2>
        <span>{t('advice.description')}</span>
      </header>

      <ul className="advice-list__articles" aria-label={t('advice.articlesLabel')}>
        {articleKeys.map((article) => (
          <li key={article}>
            <article>
              <h3>{t(`advice.${article}.title`)}</h3>
              <p>{t(`advice.${article}.summary`)}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
