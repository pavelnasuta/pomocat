// @vitest-environment node

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))

test('keeps the app shell inside the stable mobile viewport after extending into cutouts', () => {
  const css = readFileSync(`${projectRoot}src/app/app.css`, 'utf8')

  expect(css).toMatch(/\.onboarding-screen,\s*\.app-shell\s*\{[\s\S]*?min-height:\s*100svh;/)
  expect(css).toMatch(/\.app-shell\s*\{[\s\S]*?height:\s*100svh;/)
})
