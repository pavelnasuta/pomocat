import { useTranslation } from './useTranslation'

test('returns translated onboarding copy for the requested locale', () => {
  expect(useTranslation('ru').t('onboarding.nameLabel')).toBe('Как тебя зовут?')
  expect(useTranslation('en').t('onboarding.continue')).toBe('Continue')
})
