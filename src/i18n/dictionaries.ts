import type { Locale } from '../domain/types'

export const dictionaries = {
  ru: {
    'onboarding.nameLabel': 'Как тебя зовут?',
    'onboarding.continue': 'Продолжить',
    'onboarding.nameRequired': 'Введи, пожалуйста, своё имя.',
    'app.greeting': 'Привет,',
    'navigation.label': 'Основная навигация',
    'navigation.timer': 'Таймер',
    'navigation.stats': 'Статистика',
    'navigation.settings': 'Настройки',
    'mascot.label': 'Котик pomokitty',
  },
  en: {
    'onboarding.nameLabel': 'What is your name?',
    'onboarding.continue': 'Continue',
    'onboarding.nameRequired': 'Please enter your name.',
    'app.greeting': 'Hello,',
    'navigation.label': 'Primary navigation',
    'navigation.timer': 'Timer',
    'navigation.stats': 'Statistics',
    'navigation.settings': 'Settings',
    'mascot.label': 'pomokitty cat',
  },
} as const satisfies Record<Locale, Record<string, string>>

export type MessageKey = keyof (typeof dictionaries)['ru']
