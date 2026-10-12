import type { Locale } from '../domain/types'
import { dictionaries, type MessageKey } from './dictionaries'

export function useTranslation(locale: Locale): { t(key: MessageKey, values?: Record<string, string | number>): string } {
  return {
    t(key, values) {
      const message = dictionaries[locale][key]
      if (!values) return message

      return message.replace(/\{(\w+)\}/g, (_placeholder, name: string) => String(values[name] ?? ''))
    },
  }
}
