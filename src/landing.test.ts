// @vitest-environment node

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))

function buildSite() {
  execFileSync('npm', ['run', 'build'], { cwd: projectRoot, stdio: 'pipe' })
}

test('makes the parent landing the root page and links to the app route', () => {
  const landing = readFileSync(`${projectRoot}index.html`, 'utf8')

  expect(landing).toContain('Начинать дело проще')
  expect(landing).toContain('Личное остаётся личным')
  expect(landing).toContain('href="app/"')
  expect(landing).toContain('timer-screen.png')
  expect(landing).toContain('property="og:image" content="https://pavelnasuta.github.io/pomokitty/social-preview.png"')
  expect(landing).toContain('name="twitter:card" content="summary_large_image"')
  expect(landing).toContain('rel="apple-touch-icon" href="%BASE_URL%icons/apple-touch-icon.png"')
  expect(landing).toContain('НИИ МОЗГИ')
  expect(landing).toContain('Установите pomokitty как приложение')
  expect(landing).toContain('href="#install"')
  expect(landing).toContain('iPhone или iPad')
  expect(landing).toContain('Android')
  expect(landing).not.toContain('.phone::after')
  expect(landing).not.toContain('class="hero-cat"')
})

test('builds the React PWA at the app route', () => {
  buildSite()

  const app = readFileSync(`${projectRoot}dist/app/index.html`, 'utf8')
  expect(app).toContain('/pomokitty/assets/')
  expect(existsSync(`${projectRoot}dist/landing/timer-screen.png`)).toBe(true)
  expect(existsSync(`${projectRoot}dist/landing/cat-private.png`)).toBe(true)
}, 15_000)
