import { useTranslation } from './useTranslation'

test('returns translated onboarding copy for the requested locale', () => {
  expect(useTranslation('ru').t('onboarding.nameLabel')).toBe('Как тебя зовут?')
  expect(useTranslation('en').t('onboarding.continue')).toBe('Continue')
})

test('interpolates values in localized copy', () => {
  expect(useTranslation('ru').t('settings.volume', { percent: 50 })).toBe('Громкость: 50%')
  expect(useTranslation('en').t('settings.volume', { percent: 50 })).toBe('Volume: 50%')
})
