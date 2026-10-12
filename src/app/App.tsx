import { useState } from 'react'
import { BottomNav, type NavigationSection } from '../components/BottomNav'
import { Onboarding } from '../components/Onboarding'
import { clearAppData, loadAppData, saveAppData } from '../data/storage'
import { SettingsScreen } from '../features/settings/SettingsScreen'
import { StatsScreen } from '../features/stats/StatsScreen'
import { TimerScreen } from '../features/timer/TimerScreen'
import { usePomodoroController } from '../features/timer/usePomodoroController'
import type { PomodoroSettings } from '../domain/types'
import { useTranslation } from '../i18n/useTranslation'

export function App() {
  const [appData, setAppData] = useState(() => loadAppData(localStorage))
  const timerController = usePomodoroController({ appData, onAppDataChange: setAppData })
  const [activeSection, setActiveSection] = useState<NavigationSection>('timer')
  const effectiveLocale = appData.settings.locale
  const { t } = useTranslation(effectiveLocale)

  function updateAppData(nextAppData: typeof appData) {
    saveAppData(localStorage, nextAppData)
    setAppData(nextAppData)
  }

  function completeOnboarding(name: string) {
    updateAppData({
      ...appData,
      settings: {
        ...appData.settings,
        childName: name,
      },
    })
  }

  function updateSettings(settings: PomodoroSettings) {
    updateAppData({ ...appData, settings })
  }

  async function clearData() {
    await timerController.reset()
    clearAppData(localStorage)
    setAppData(loadAppData(localStorage))
    setActiveSection('timer')
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
            <TimerScreen controller={timerController} />
          </section>
        )}

        {activeSection === 'stats' && (
          <section className="app-section app-section--scroll" aria-labelledby="stats-section-title">
            <h1 id="stats-section-title">{t('navigation.stats')}</h1>
            <StatsScreen history={appData.history} locale={effectiveLocale} />
          </section>
        )}

        {activeSection === 'settings' && (
          <section className="app-section app-section--scroll" aria-labelledby="settings-section-title">
            <h1 id="settings-section-title">{t('navigation.settings')}</h1>
            <SettingsScreen data={appData} onChange={updateSettings} onClearData={clearData} />
          </section>
        )}
      </div>

      <BottomNav active={activeSection} locale={effectiveLocale} onChange={setActiveSection} />
    </main>
  )
}
