import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Cat } from 'lucide-react'
import { BottomNav, type NavigationSection } from '../components/BottomNav'
import { Onboarding, type OnboardingResult } from '../components/Onboarding'
import { clearAppData, loadAppData, saveAppData } from '../data/storage'
import { NotificationController } from '../device/notifications'
import { SettingsScreen } from '../features/settings/SettingsScreen'
import { AdviceArticleScreen } from '../features/advice/AdviceArticleScreen'
import { AdviceListScreen } from '../features/advice/AdviceListScreen'
import type { AdviceArticleId } from '../features/advice/articles'
import { StatsScreen } from '../features/stats/StatsScreen'
import { TimerScreen } from '../features/timer/TimerScreen'
import { usePomodoroController } from '../features/timer/usePomodoroController'
import { getAllSessionCount } from '../domain/stats'
import { appThemes } from '../theme/themes'
import type { PomodoroSettings } from '../domain/types'
import { useTranslation } from '../i18n/useTranslation'

export function App() {
  const [appData, setAppData] = useState(() => loadAppData(localStorage))
  const [unsavedData, setUnsavedData] = useState(false)
  const notifications = useRef(new NotificationController()).current
  const timerController = usePomodoroController({
    appData,
    notifications,
    onAppDataChange: setAppData,
    onPersistenceChange: setUnsavedData,
  })
  const [activeSection, setActiveSection] = useState<NavigationSection>('timer')
  const [activeAdviceArticle, setActiveAdviceArticle] = useState<AdviceArticleId>()
  const effectiveLocale = appData.settings.locale
  const theme = appData.settings.theme ?? 'terracotta'
  const screenKey = activeSection === 'advice' ? `advice-${activeAdviceArticle ?? 'list'}` : activeSection
  const { t } = useTranslation(effectiveLocale)

  useEffect(() => {
    document.documentElement.lang = effectiveLocale
  }, [effectiveLocale])

  useEffect(() => {
    let themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!themeColor) {
      themeColor = document.createElement('meta')
      themeColor.name = 'theme-color'
      document.head.append(themeColor)
    }
    themeColor.content = appThemes[theme].statusBarColor
  }, [theme])

  function updateAppData(nextAppData: typeof appData) {
    setUnsavedData(!saveAppData(localStorage, nextAppData))
    setAppData(nextAppData)
  }

  async function requestNotifications(): Promise<boolean> {
    return (await notifications.requestPermission()) === 'granted'
  }

  function completeOnboarding({ childName, selectedSound, theme }: OnboardingResult) {
    updateAppData({
      ...appData,
      settings: {
        ...appData.settings,
        childName,
        selectedSound,
        soundEnabled: true,
        theme,
      },
    })
  }

  function updateSettings(settings: PomodoroSettings) {
    updateAppData({ ...appData, settings })
  }

  async function clearData() {
    await timerController.reset()
    setUnsavedData(!clearAppData(localStorage))
    setAppData(loadAppData(localStorage))
    setActiveSection('timer')
  }

  if (!appData.settings.childName) {
    return <Onboarding onComplete={completeOnboarding} />
  }

  return (
    <main className="app-shell" aria-label="pomokitty" style={appThemes[theme].variables as CSSProperties}>
      <header className="app-shell__header">
        <span className="app-shell__brand">pomokitty</span>
        <div className="app-shell__profile">
          <p className="app-shell__greeting">
            {t('app.greeting')} {appData.settings.childName}
          </p>
          <div
            className="app-shell__cat-total"
            aria-label={t('app.totalCats', { count: getAllSessionCount(appData.history) })}
          >
            <Cat aria-hidden size={18} strokeWidth={1.8} />
            <output>{getAllSessionCount(appData.history)}</output>
          </div>
        </div>
        {unsavedData && <p role="status">{t('app.unsavedData')}</p>}
      </header>

      <div className="app-shell__content">
        <div className="app-shell__screen" data-screen={activeSection} key={screenKey}>
        {activeSection === 'timer' && (
          <section className="app-section app-section--timer" aria-label={t('navigation.timer')}>
            <TimerScreen controller={timerController} theme={theme} />
          </section>
        )}

        {activeSection === 'stats' && (
          <section className="app-section app-section--scroll" aria-labelledby="stats-section-title">
            <h1 id="stats-section-title">{t('navigation.stats')}</h1>
            <StatsScreen
              history={appData.history}
              locale={effectiveLocale}
              childName={appData.settings.childName}
              theme={theme}
            />
          </section>
        )}

        {activeSection === 'advice' && (
          <section className="app-section app-section--scroll" aria-label={t('navigation.advice')}>
            {activeAdviceArticle ? (
              <AdviceArticleScreen
                article={activeAdviceArticle}
                locale={effectiveLocale}
                onBack={() => setActiveAdviceArticle(undefined)}
              />
            ) : (
              <AdviceListScreen locale={effectiveLocale} onOpen={setActiveAdviceArticle} />
            )}
          </section>
        )}

        {activeSection === 'settings' && (
          <section className="app-section app-section--scroll" aria-labelledby="settings-section-title">
            <h1 id="settings-section-title">{t('navigation.settings')}</h1>
            <SettingsScreen data={appData} onChange={updateSettings} onClearData={clearData} onRequestNotifications={requestNotifications} />
          </section>
        )}
        </div>
      </div>

      <BottomNav active={activeSection} locale={effectiveLocale} onChange={setActiveSection} />
    </main>
  )
}
