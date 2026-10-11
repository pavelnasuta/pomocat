import type { Locale } from '../domain/types'
import { dictionaries, type MessageKey } from './dictionaries'

export function useTranslation(locale: Locale): { t(key: MessageKey): string } {
  return {
    t(key) {
      return dictionaries[locale][key]
    },
  }
}
