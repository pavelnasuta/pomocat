import type { Locale, SoundId } from '../../domain/types'
import { useTranslation } from '../../i18n/useTranslation'

export interface SoundSettingsProps {
  selectedSound: SoundId
  volume: number
  onSelect(sound: SoundId): void
  onVolumeChange(volume: number): void
  locale?: Locale
}

const sounds: SoundId[] = ['none', 'rain', 'forest', 'fireplace', 'ocean', 'whiteNoise']

export function SoundSettings({
  selectedSound,
  volume,
  onSelect,
  onVolumeChange,
  locale = 'ru',
}: SoundSettingsProps) {
  const { t } = useTranslation(locale)
  const volumePercent = Math.round(Math.min(1, Math.max(0, volume)) * 100)

  return (
    <fieldset className="sound-settings">
      <legend>{t('settings.sound')}</legend>
      <label>
        <span>{t('settings.soundChoice')}</span>
        <select value={selectedSound} onChange={(event) => onSelect(event.target.value as SoundId)}>
          {sounds.map((sound) => (
            <option key={sound} value={sound}>
              {t(`settings.sound.${sound}`)}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor="sound-volume">
        {t('settings.volume', { percent: volumePercent })}
      </label>
      <input
        id="sound-volume"
        type="range"
        min="0"
        max="100"
        step="1"
        value={volumePercent}
        onChange={(event) => onVolumeChange(Number(event.currentTarget.value) / 100)}
      />
    </fieldset>
  )
}
