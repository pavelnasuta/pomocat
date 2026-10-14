// @vitest-environment node

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { UserConfig, UserConfigExport } from 'vite'

import config from '../vite.config'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))

let pwaBuild: { manifest: Record<string, unknown>; serviceWorker: string } | undefined

function productionConfig() {
  const configExport = config as unknown as UserConfigExport

  return (typeof configExport === 'function'
    ? configExport({ command: 'build', mode: 'production', isSsrBuild: false, isPreview: false })
    : configExport) as UserConfig
}

function buildPwa() {
  if (!pwaBuild) {
    execFileSync('npm', ['run', 'build'], { cwd: projectRoot, stdio: 'pipe' })
    pwaBuild = {
      manifest: JSON.parse(readFileSync(`${projectRoot}dist/manifest.webmanifest`, 'utf8')),
      serviceWorker: readFileSync(`${projectRoot}dist/sw.js`, 'utf8'),
    }
  }

  return pwaBuild
}

test('registers a PWA plugin for pomokitty production builds', () => {
  const resolvedConfig = productionConfig()
  const plugins = resolvedConfig.plugins as unknown as Array<{ name?: string }>
  const pwaPlugin = plugins.find((plugin) => plugin.name === 'vite-plugin-pwa')

  expect(pwaPlugin).toBeDefined()
  expect(resolvedConfig.base).toBe('/pomokitty/')
})

test('builds a standalone pomokitty manifest with both local icons', () => {
  const { manifest } = buildPwa()

  expect(manifest).toMatchObject({
    name: 'pomokitty',
    short_name: 'pomokitty',
    start_url: '/pomokitty/app/',
    scope: '/pomokitty/app/',
    display: 'standalone',
    theme_color: '#99432c',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  })
}, 15_000)

test('configures edge-to-edge status bars for the standalone app route', () => {
  const index = readFileSync(`${projectRoot}app/index.html`, 'utf8')

  expect(index).toContain('viewport-fit=cover')
  expect(index).toContain('name="apple-mobile-web-app-capable" content="yes"')
  expect(index).toContain('name="apple-mobile-web-app-status-bar-style" content="black-translucent"')
  expect(index).toContain('name="theme-color" content="#99432c"')
})

test('precaches only the approved background audio in the service worker', () => {
  const { serviceWorker } = buildPwa()

  for (const sound of ['brown-noise', 'forest-rain', 'ocean', 'night-forest']) {
    expect(serviceWorker).toContain(`sounds/${sound}.opus`)
  }
  expect(serviceWorker).toContain('sounds/ding.mp3')
  for (const removedSound of ['rain', 'white-noise', 'distant-thunder']) {
    expect(serviceWorker).not.toContain(`sounds/${removedSound}.mp3`)
  }
})

test('includes local icons for the web app manifest', () => {
  expect(existsSync(`${projectRoot}public/icons/icon-192.png`)).toBe(true)
  expect(existsSync(`${projectRoot}public/icons/icon-512.png`)).toBe(true)
})

test('deploys the built site through the GitHub Pages action chain', () => {
  const workflow = readFileSync(`${projectRoot}.github/workflows/deploy-pages.yml`, 'utf8')

  expect(workflow).toMatch(/push:\s*\n\s+branches:\s*\[main\]/)
  expect(workflow).toMatch(/contents:\s*read/)
  expect(workflow).toMatch(/pages:\s*write/)
  expect(workflow).toMatch(/id-token:\s*write/)
  expect(workflow).toMatch(/actions\/configure-pages@/)
  expect(workflow).toMatch(/actions\/upload-pages-artifact@/)
  expect(workflow).toMatch(/path:\s*\.\/dist/)
  expect(workflow).toMatch(/actions\/deploy-pages@/)
})

test('documents a runnable local production preview command', () => {
  const readme = readFileSync(`${projectRoot}README.md`, 'utf8')
  const packageJson = JSON.parse(readFileSync(`${projectRoot}package.json`, 'utf8')) as {
    scripts?: Record<string, string>
  }

  expect(readme).toContain('npm run preview')
  expect(packageJson.scripts?.preview).toBe('vite preview')
  expect(() => execFileSync('npm', ['run', 'preview', '--', '--help'], { cwd: projectRoot, stdio: 'pipe' })).not.toThrow()
})
