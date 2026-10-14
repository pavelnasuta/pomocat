// @vitest-environment node

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))

test('keeps the app shell inside the stable mobile viewport after extending into cutouts', () => {
  const css = readFileSync(`${projectRoot}src/app/app.css`, 'utf8')

  expect(css).toMatch(/\.onboarding-screen,\s*\.app-shell\s*\{[\s\S]*?min-height:\s*100svh;/)
  expect(css).toMatch(/\.app-shell\s*\{[\s\S]*?height:\s*100svh;/)
})

test('normalizes the timer mascot frame across every pose', () => {
  const css = readFileSync(`${projectRoot}src/app/app.css`, 'utf8')

  expect(css).toMatch(/\.timer-screen__actions \.mascot\s*\{[\s\S]*?aspect-ratio:\s*428\s*\/\s*340;/)
  expect(css).toMatch(/\.timer-screen__actions \.mascot__image\s*\{[\s\S]*?height:\s*100%;[\s\S]*?object-fit:\s*contain;/)
})
