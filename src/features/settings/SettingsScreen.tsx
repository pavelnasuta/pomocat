import { useEffect, useState } from 'react'
import type { AppData, PomodoroSettings } from '../../domain/types'
import { useTranslation } from '../../i18n/useTranslation'
import { SoundSettings } from './SoundSettings'

export interface SettingsScreenProps {
  data: AppData
  onChange(settings: PomodoroSettings): void
  onClearData(): void
}

function durationValue(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function SettingsScreen({ data, onChange, onClearData }: SettingsScreenProps) {
  const { t } = useTranslation(data.settings.locale)
  const [settings, setSettings] = useState(data.settings)
  const [name, setName] = useState(data.settings.childName ?? '')
  const [confirmingClear, setConfirmingClear] = useState(false)

  useEffect(() => {
    setSettings(data.settings)
    setName(data.settings.childName ?? '')
  }, [data.settings])

  function updateSettings(change: Partial<PomodoroSettings>) {
    const nextSettings = { ...settings, ...change }
    setSettings(nextSettings)
    onChange(nextSettings)
  }

  function saveName() {
    const childName = name.trim() || undefined
    updateSettings({ childName })
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
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>{t('settings.timer')}</legend>
          <label>
            <span>{t('settings.focusMinutes')}</span>
            <input type="number" min="1" value={settings.focusMinutes} onChange={(event) => updateSettings({ focusMinutes: durationValue(event.target.value) })} />
          </label>
          <label>
            <span>{t('settings.shortBreakMinutes')}</span>
            <input type="number" min="1" value={settings.shortBreakMinutes} onChange={(event) => updateSettings({ shortBreakMinutes: durationValue(event.target.value) })} />
          </label>
          <label>
            <span>{t('settings.longBreakMinutes')}</span>
            <input type="number" min="1" value={settings.longBreakMinutes} onChange={(event) => updateSettings({ longBreakMinutes: durationValue(event.target.value) })} />
          </label>
          <label>
            <span>{t('settings.rounds')}</span>
            <input type="number" min="1" value={settings.roundsBeforeLongBreak} onChange={(event) => updateSettings({ roundsBeforeLongBreak: durationValue(event.target.value) })} />
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
            <input type="checkbox" checked={settings.notificationsEnabled} onChange={(event) => updateSettings({ notificationsEnabled: event.target.checked })} />
            <span>{t('settings.notifications')}</span>
          </label>
          <label className="settings-screen__toggle">
            <input type="checkbox" checked={settings.animationsEnabled} onChange={(event) => updateSettings({ animationsEnabled: event.target.checked })} />
            <span>{t('settings.animations')}</span>
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
