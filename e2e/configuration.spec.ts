import { expect, test } from '@playwright/test'

test('runs the isolated E2E suite', () => {
  expect(test.info().file).toContain('/e2e/')
})
