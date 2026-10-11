import { useState } from 'react'
import { BottomNav, type NavigationSection } from '../components/BottomNav'
import { Mascot } from '../components/Mascot'
import { Onboarding } from '../components/Onboarding'
import { loadAppData, saveAppData } from '../data/storage'
import { useTranslation } from '../i18n/useTranslation'

export function App() {
  const [appData, setAppData] = useState(() => loadAppData(localStorage))
  const [activeSection, setActiveSection] = useState<NavigationSection>('timer')
  const { t } = useTranslation(appData.settings.locale)

  function completeOnboarding(name: string) {
    const nextAppData = {
      ...appData,
      settings: {
        ...appData.settings,
        childName: name,
      },
    }

    saveAppData(localStorage, nextAppData)
    setAppData(nextAppData)
  }

  if (!appData.settings.childName) {
    return <Onboarding onComplete={completeOnboarding} />
  }

  return (
    <main className="app-shell" aria-label="pomokitty">
      <header className="app-shell__header">
        <span className="app-shell__brand">pomokitty</span>
        <p className="app-shell__greeting">
          {t('app.greeting')} {appData.settings.childName}
        </p>
      </header>

      <div className="app-shell__content">
        {activeSection === 'timer' && (
          <section className="app-section app-section--timer" aria-labelledby="timer-section-title">
            <h1 id="timer-section-title">{t('navigation.timer')}</h1>
            <Mascot active={false} animationsEnabled={appData.settings.animationsEnabled} />
          </section>
        )}

        {activeSection === 'stats' && (
          <section className="app-section app-section--scroll" aria-labelledby="stats-section-title">
            <h1 id="stats-section-title">{t('navigation.stats')}</h1>
          </section>
        )}

        {activeSection === 'settings' && (
          <section className="app-section app-section--scroll" aria-labelledby="settings-section-title">
            <h1 id="settings-section-title">{t('navigation.settings')}</h1>
          </section>
        )}
      </div>

      <BottomNav active={activeSection} onChange={setActiveSection} />
    </main>
  )
}
