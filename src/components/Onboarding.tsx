import { useState, type FormEvent } from 'react'
import { loadAppData } from '../data/storage'
import { useTranslation } from '../i18n/useTranslation'

interface OnboardingProps {
  onComplete(name: string): void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const locale = loadAppData(localStorage).settings.locale
  const { t } = useTranslation(locale)
  const [name, setName] = useState('')
  const [hasNameError, setHasNameError] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setHasNameError(true)
      return
    }

    setHasNameError(false)
    onComplete(trimmedName)
  }

  return (
    <main className="onboarding-screen" aria-label="pomokitty">
      <section className="onboarding-card">
        <h1 id="onboarding-title">{t('onboarding.nameLabel')}</h1>
        <form className="onboarding-form" onSubmit={handleSubmit}>
          <label htmlFor="child-name">{t('onboarding.nameLabel')}</label>
          <input
            id="child-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          {hasNameError && <p role="alert">{t('onboarding.nameRequired')}</p>}
          <button type="submit">{t('onboarding.continue')}</button>
        </form>
      </section>
    </main>
  )
}
