import { useEffect, useState } from 'react'
import type { AppData, PomodoroSettings } from '../../domain/types'
import { useTranslation } from '../../i18n/useTranslation'
import { SoundSettings } from './SoundSettings'

export interface SettingsScreenProps {
  data: AppData
  onChange(settings: PomodoroSettings): void
  onClearData(): void
  onRequestNotifications(): Promise<boolean>
}

type NumericSetting = 'focusMinutes' | 'shortBreakMinutes' | 'longBreakMinutes' | 'roundsBeforeLongBreak'

function numericInputs(settings: PomodoroSettings): Record<NumericSetting, string> {
  return {
    focusMinutes: String(settings.focusMinutes),
    shortBreakMinutes: String(settings.shortBreakMinutes),
    longBreakMinutes: String(settings.longBreakMinutes),
    roundsBeforeLongBreak: String(settings.roundsBeforeLongBreak),
  }
}

export function SettingsScreen({ data, onChange, onClearData, onRequestNotifications }: SettingsScreenProps) {
  const { t } = useTranslation(data.settings.locale)
  const [settings, setSettings] = useState(data.settings)
  const [numericValues, setNumericValues] = useState(() => numericInputs(data.settings))
  const [name, setName] = useState(data.settings.childName ?? '')
  const [confirmingClear, setConfirmingClear] = useState(false)

  useEffect(() => {
    setSettings(data.settings)
    setNumericValues(numericInputs(data.settings))
    setName(data.settings.childName ?? '')
  }, [data.settings])

  function updateSettings(change: Partial<PomodoroSettings>) {
    const nextSettings = { ...settings, ...change }
    setSettings(nextSettings)
    onChange(nextSettings)
  }

  async function updateNotifications(enabled: boolean) {
    if (!enabled) {
      updateSettings({ notificationsEnabled: false })
      return
    }
    if (await onRequestNotifications()) updateSettings({ notificationsEnabled: true })
  }

  function saveName() {
    const childName = name.trim() || undefined
    updateSettings({ childName })
  }

  function updateNumericSetting(setting: NumericSetting, value: string) {
    setNumericValues((current) => ({ ...current, [setting]: value }))
    const parsed = Number(value)
    if (value === '' || !Number.isFinite(parsed) || parsed < 1) return
    updateSettings({ [setting]: parsed })
  }

  return (
    <section className="settings-screen" aria-label={t('navigation.settings')}>
      <form className="settings-screen__form" onSubmit={(event) => event.preventDefault()}>
        <fieldset>
          <legend>{t('settings.profile')}</legend>
          <label htmlFor="settings-child-name">{t('settings.childName')}</label>
          <div className="settings-screen__name-row">
            <input
              id="settings-child-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button type="button" onClick={saveName}>{t('settings.saveName')}</button>
          </div>
          <label>
            <span>{t('settings.locale')}</span>
            <select value={data.settings.locale} onChange={(event) => updateSettings({ locale: event.target.value as PomodoroSettings['locale'] })}>
              <option value="ru">{t('settings.locale.ru')}</option>
              <option value="en">{t('settings.locale.en')}</option>
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>{t('settings.timer')}</legend>
          <label>
            <span>{t('settings.focusMinutes')}</span>
            <input type="number" min="1" value={numericValues.focusMinutes} onChange={(event) => updateNumericSetting('focusMinutes', event.target.value)} />
          </label>
          <label>
            <span>{t('settings.shortBreakMinutes')}</span>
            <input type="number" min="1" value={numericValues.shortBreakMinutes} onChange={(event) => updateNumericSetting('shortBreakMinutes', event.target.value)} />
          </label>
          <label>
            <span>{t('settings.longBreakMinutes')}</span>
            <input type="number" min="1" value={numericValues.longBreakMinutes} onChange={(event) => updateNumericSetting('longBreakMinutes', event.target.value)} />
          </label>
          <label>
            <span>{t('settings.rounds')}</span>
            <input type="number" min="1" value={numericValues.roundsBeforeLongBreak} onChange={(event) => updateNumericSetting('roundsBeforeLongBreak', event.target.value)} />
          </label>
          <label className="settings-screen__toggle">
            <input type="checkbox" checked={settings.autoStartNext} onChange={(event) => updateSettings({ autoStartNext: event.target.checked })} />
            <span>{t('settings.autoStart')}</span>
          </label>
        </fieldset>

        <SoundSettings
          selectedSound={settings.selectedSound}
          volume={settings.soundVolume}
          onSelect={(selectedSound) => updateSettings({ selectedSound })}
          onVolumeChange={(soundVolume) => updateSettings({ soundVolume })}
          locale={data.settings.locale}
        />

        <fieldset>
          <legend>{t('settings.device')}</legend>
          <label className="settings-screen__toggle">
            <input type="checkbox" checked={settings.notificationsEnabled} onChange={(event) => void updateNotifications(event.target.checked)} />
            <span>{t('settings.notifications')}</span>
          </label>
          <label className="settings-screen__toggle">
            <input type="checkbox" checked={settings.keepScreenAwake} onChange={(event) => updateSettings({ keepScreenAwake: event.target.checked })} />
            <span>{t('settings.wakeLock')}</span>
          </label>
        </fieldset>

        <fieldset className="settings-screen__danger">
          <legend>{t('settings.data')}</legend>
          {confirmingClear ? (
            <div role="alert">
              <p>{t('settings.clearWarning')}</p>
              <button type="button" onClick={onClearData}>{t('settings.clearConfirm')}</button>
              <button type="button" onClick={() => setConfirmingClear(false)}>{t('settings.cancel')}</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmingClear(true)}>{t('settings.clear')}</button>
          )}
        </fieldset>
      </form>
    </section>
  )
}
