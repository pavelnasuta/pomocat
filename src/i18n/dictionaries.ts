import type { Locale } from '../domain/types'

export const dictionaries = {
  ru: {
    'onboarding.nameLabel': 'Как тебя зовут?',
    'onboarding.continue': 'Продолжить',
    'onboarding.nameRequired': 'Введи, пожалуйста, своё имя.',
  },
  en: {
    'onboarding.nameLabel': 'What is your name?',
    'onboarding.continue': 'Continue',
    'onboarding.nameRequired': 'Please enter your name.',
  },
} as const satisfies Record<Locale, Record<string, string>>

export type MessageKey = keyof (typeof dictionaries)['ru']
