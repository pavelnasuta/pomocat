import type { Locale } from '../../domain/types'
import { useTranslation } from '../../i18n/useTranslation'
import { articleImages, type AdviceArticleId } from './articles'

interface AdviceArticleScreenProps {
  article: AdviceArticleId
  locale: Locale
  onBack(): void
}

export function AdviceArticleScreen({ article, locale, onBack }: AdviceArticleScreenProps) {
  const { t } = useTranslation(locale)

  return (
    <article className="advice-article" aria-labelledby="advice-article-title">
      <img className="advice-article__illustration" src={articleImages[article]} alt={t(`advice.${article}.imageAlt`)} />
      <h2 id="advice-article-title">{t(`advice.${article}.title`)}</h2>
      {(['body1', 'body2', 'body3'] as const).map((part) => (
        <p key={part}>{t(`advice.${article}.${part}`)}</p>
      ))}
      <button type="button" className="advice-article__back" onClick={onBack}>
        {t('advice.back')}
      </button>
    </article>
  )
}
