import { useState, type CSSProperties, type FormEvent } from 'react'
import { AudioWaveform, CloudRain, LockKeyhole, Trees, Waves } from 'lucide-react'
import { loadAppData } from '../data/storage'
import type { SoundId } from '../domain/types'
import { useTranslation } from '../i18n/useTranslation'
import { appThemes, themeIds, type ThemeId } from '../theme/themes'
import { Mascot } from './Mascot'

export interface OnboardingResult {
  childName: string
  selectedSound: Extract<SoundId, 'brownNoise' | 'forestRain' | 'ocean' | 'nightForest'>
  theme: ThemeId
}

interface OnboardingProps {
  onComplete(result: OnboardingResult): void
}

type OnboardingStep = 'name' | 'data' | 'personalize'
type OnboardingSound = OnboardingResult['selectedSound']

const soundOptions: Array<{ id: OnboardingSound; icon: typeof AudioWaveform; labelKey: 'settings.sound.brownNoise' | 'settings.sound.forestRain' | 'settings.sound.ocean' | 'settings.sound.nightForest' }> = [
  { id: 'brownNoise', icon: AudioWaveform, labelKey: 'settings.sound.brownNoise' },
  { id: 'forestRain', icon: CloudRain, labelKey: 'settings.sound.forestRain' },
  { id: 'ocean', icon: Waves, labelKey: 'settings.sound.ocean' },
  { id: 'nightForest', icon: Trees, labelKey: 'settings.sound.nightForest' },
]

export function Onboarding({ onComplete }: OnboardingProps) {
  const locale = loadAppData(localStorage).settings.locale
  const { t } = useTranslation(locale)
  const [step, setStep] = useState<OnboardingStep>('name')
  const [name, setName] = useState('')
  const [selectedSound, setSelectedSound] = useState<OnboardingSound>('forestRain')
  const [theme, setTheme] = useState<ThemeId>('terracotta')
  const [hasNameError, setHasNameError] = useState(false)
  const stepIndex = ['name', 'data', 'personalize'].indexOf(step)

  function advanceFromName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setHasNameError(true)
      return
    }

    setName(trimmedName)
    setHasNameError(false)
    setStep('data')
  }

  function goBack() {
    if (step === 'data') setStep('name')
    if (step === 'personalize') setStep('data')
  }

  function finish() {
    onComplete({ childName: name.trim(), selectedSound, theme })
  }

  return (
    <main
      className="onboarding-screen"
      aria-label="pomokitty"
      style={appThemes[theme].variables as CSSProperties}
    >
      <section className="onboarding-card" aria-labelledby="onboarding-title">
        <header className="onboarding-card__topline">
          <span className="onboarding-card__brand">pomokitty</span>
          <span className="onboarding-card__step">{t('onboarding.step', { current: stepIndex + 1, total: 3 })}</span>
        </header>

        <div className="onboarding-card__content">
          {step === 'name' && (
            <>
              <Mascot active={false} animationsEnabled={false} locale={locale} pose="celebrate" theme={theme} />
              <h1 id="onboarding-title">{t('onboarding.welcomeTitle')}</h1>
              <p className="onboarding-card__lead">{t('onboarding.welcomeDescription')}</p>
              <form className="onboarding-form" onSubmit={advanceFromName}>
                <label htmlFor="child-name">{t('onboarding.nameLabel')}</label>
                <input
                  id="child-name"
                  value={name}
                  autoComplete="given-name"
                  onChange={(event) => setName(event.target.value)}
                />
                {hasNameError && <p role="alert">{t('onboarding.nameRequired')}</p>}
                <button className="onboarding-card__primary" type="submit">{t('onboarding.next')}</button>
              </form>
              <p className="onboarding-card__note">{t('onboarding.noAccountNote')}</p>
            </>
          )}

          {step === 'data' && (
            <>
              <div className="onboarding-card__icon" aria-hidden="true"><LockKeyhole size={34} strokeWidth={1.8} /></div>
              <p className="onboarding-card__eyebrow">{t('onboarding.localEyebrow')}</p>
              <h1 id="onboarding-title">{t('onboarding.dataTitle')}</h1>
              <p className="onboarding-card__lead">{t('onboarding.dataDescription')}</p>
              <ul className="onboarding-card__rules">
                <li>{t('onboarding.dataRuleStored')}</li>
                <li>{t('onboarding.dataRulePrivate')}</li>
              </ul>
              <p className="onboarding-card__note">{t('onboarding.dataRemoval')}</p>
            </>
          )}

          {step === 'personalize' && (
            <>
              <Mascot active={false} animationsEnabled={false} locale={locale} pose="celebrate" theme={theme} />
              <h1 id="onboarding-title">{t('onboarding.readyTitle')}</h1>
              <p className="onboarding-card__lead">{t('onboarding.readyDescription')}</p>
              <div className="onboarding-card__choices">
                <div>
                  <p className="onboarding-card__choice-label">{t('onboarding.soundLabel')}</p>
                  <div className="onboarding-card__sound-options" aria-label={t('onboarding.soundLabel')}>
                    {soundOptions.map(({ id, icon: Icon, labelKey }) => (
                      <button
                        key={id}
                        type="button"
                        className={`onboarding-card__sound${selectedSound === id ? ' onboarding-card__sound--selected' : ''}`}
                        aria-label={t(labelKey)}
                        aria-pressed={selectedSound === id}
                        onClick={() => setSelectedSound(id)}
                      >
                        <Icon size={21} strokeWidth={1.8} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="onboarding-card__choice-label">{t('onboarding.themeLabel')}</p>
                  <div className="onboarding-card__theme-options" aria-label={t('onboarding.themeLabel')}>
                    {themeIds.map((themeId) => (
                      <button
                        key={themeId}
                        type="button"
                        className={`onboarding-card__swatch${theme === themeId ? ' onboarding-card__swatch--selected' : ''}`}
                        style={{ '--onboarding-swatch': appThemes[themeId].accent } as CSSProperties}
                        aria-label={t(appThemes[themeId].labelKey)}
                        aria-pressed={theme === themeId}
                        onClick={() => setTheme(themeId)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="onboarding-card__footer">
          <div className="onboarding-card__progress" aria-label={t('onboarding.progress', { current: stepIndex + 1, total: 3 })}>
            {[0, 1, 2].map((index) => <span className={index === stepIndex ? 'onboarding-card__progress-dot--active' : ''} key={index} />)}
          </div>
          {step !== 'name' && <button className="onboarding-card__back" type="button" onClick={goBack}>{t('onboarding.back')}</button>}
          {step === 'data' && <button className="onboarding-card__primary" type="button" onClick={() => setStep('personalize')}>{t('onboarding.gotIt')}</button>}
          {step === 'personalize' && <button className="onboarding-card__primary" type="button" onClick={finish}>{t('onboarding.start')}</button>}
        </footer>
      </section>
    </main>
  )
}
