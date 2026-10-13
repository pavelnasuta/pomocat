import { appThemes, themeIds, type ThemeId } from '../../theme/themes'
import type { Locale } from '../../domain/types'
import { useTranslation } from '../../i18n/useTranslation'

interface ThemeSettingsProps {
  selectedTheme: ThemeId
  locale: Locale
  onSelect(theme: ThemeId): void
}

export function ThemeSettings({ selectedTheme, locale, onSelect }: ThemeSettingsProps) {
  const { t } = useTranslation(locale)

  return (
    <fieldset className="theme-settings">
      <legend>{t('settings.theme')}</legend>
      <div className="theme-settings__options" role="radiogroup" aria-label={t('settings.theme')}>
        {themeIds.map((theme) => {
          const themeDefinition = appThemes[theme]
          return (
            <label className="theme-settings__option" key={theme}>
              <input
                type="radio"
                name="app-theme"
                value={theme}
                checked={selectedTheme === theme}
                onChange={() => onSelect(theme)}
              />
              <span className="theme-settings__swatch" aria-hidden style={{ background: themeDefinition.accent }} />
              <span>{t(themeDefinition.labelKey)}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
