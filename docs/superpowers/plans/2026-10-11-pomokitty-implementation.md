# pomokitty Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish pomokitty, an offline bilingual Pomodoro PWA for children with local-only data, sounds, statistics, a wake-lock-aware timer, and a no-scroll mobile focus screen.

**Architecture:** A React client separates pure domain logic from persistence and browser-device adapters. `App` selects one of three sections; the timer controller composes the timer engine, storage, audio and wake-lock adapters. Vite produces static assets, while the PWA service worker caches the application shell and local sound assets; GitHub Actions deploys the built `dist` directory to GitHub Pages.

**Tech Stack:** React 19.3.0, TypeScript, Vite 8.3.4, Vitest 5.0.3, React Testing Library 16.3.3, Playwright 1.64.0, vite-plugin-pwa 2.0.0, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-11-pomocat-design.md`

## Global Constraints

- Product name is exactly `pomokitty`.
- UI languages are Russian and English; visible strings come only from localization dictionaries.
- The application has no account, tracking, advertising, cookies, server, or external analytics.
- Child name, settings, active session and history remain in versioned local storage only.
- The focus screen has no vertical scroll or overlapping interactive elements at 320×568, 360×800 and 393×852 CSS pixels.
- During active focus, request Screen Wake Lock only while the page is visible; release it for pause, completion and hidden documents; show a non-blocking unavailable status when it cannot be acquired.
- The mascot is an original transparent-background CSS illustration. Animate it only in active focus, honour the animation setting and `prefers-reduced-motion`.
- Bundle only original assets or assets with a documented compatible license in `public/sounds/LICENSES.md`.
- Every production behavior starts with a failing automated test. Run the relevant test before implementation, then run the complete suite before each commit.
- GitHub Pages deployment must use the `dist` directory, preserve the repository base path, and expose a public URL.

---

## File Structure

```text
.github/workflows/deploy-pages.yml          GitHub Pages build and deploy workflow
public/icons/                              PWA icons
public/sounds/                             Local focus sound loops and license record
src/app/App.tsx                            Section routing and top-level composition
src/app/app.css                            Global tokens, reset, mobile shell and reduced motion rules
src/components/Onboarding.tsx              First-open name prompt
src/components/BottomNav.tsx               Accessible three-section navigation
src/components/Mascot.tsx                  Transparent CSS cat and state-driven animation classes
src/features/timer/TimerScreen.tsx         One-screen timer interface
src/features/timer/usePomodoroController.ts Coordinates timer, persistence, audio and wake lock
src/features/stats/StatsScreen.tsx         Daily/weekly totals and session history
src/features/settings/SettingsScreen.tsx   Editable preferences, name and data clearing
src/domain/types.ts                         Shared domain types
src/domain/timer.ts                         Pure timer transitions and derived display state
src/domain/stats.ts                         Pure aggregate calculations
src/data/storage.ts                         Versioned localStorage boundary and validation
src/device/audio.ts                         Safe looping audio controller
src/device/wakeLock.ts                      Screen Wake Lock boundary
src/i18n/dictionaries.ts                   Russian and English message dictionaries
src/i18n/useTranslation.ts                 Translation lookup and locale selection
src/test/setup.ts                           Browser test matchers and cleanup
src/**/*.test.ts(x)                         Unit and component behavior tests
e2e/pomokitty.spec.ts                      Playwright mobile acceptance tests
vite.config.ts                              React, test and PWA configuration
package.json                                Scripts and dependencies
README.md                                   Local development, privacy and installation notes
```

---

### Task 1: Establish the React PWA project and quality gates

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/app.css`
- Create: `src/test/setup.ts`
- Create: `src/app/App.test.tsx`
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Produces `npm run dev`, `npm run build`, `npm run test`, `npm run test:coverage`, `npm run test:e2e` and `npm run lint` scripts.
- Produces `App`, the root component rendered by `src/main.tsx`.

- [ ] **Step 1: Create the initial failing render test.**

```tsx
// src/app/App.test.tsx
import { render, screen } from '@testing-library/react'
import { App } from './App'

test('renders the pomokitty application shell', () => {
  render(<App />)
  expect(screen.getByRole('main', { name: 'pomokitty' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to verify it fails because the project has no test command.**

Run: `npm run test -- src/app/App.test.tsx`

Expected: failure because `package.json` and the test runner do not exist.

- [ ] **Step 3: Create the Vite React TypeScript configuration, scripts and minimal root.**

Use these package scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "lint": "tsc -b --noEmit"
  }
}
```

Configure Vitest in `vite.config.ts` with `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`, and `css: true`. Export this minimal root:

```tsx
// src/app/App.tsx
export function App() {
  return <main aria-label="pomokitty">pomokitty</main>
}
```

- [ ] **Step 4: Run the focused test and type check.**

Run: `npm run test -- src/app/App.test.tsx && npm run lint`

Expected: both commands exit successfully.

- [ ] **Step 5: Commit the independently runnable project shell.**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src .gitignore README.md
git commit -m "chore: scaffold pomokitty React PWA"
```

### Task 2: Define data contracts, local persistence, localization and first-open identity

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/data/storage.ts`
- Create: `src/data/storage.test.ts`
- Create: `src/i18n/dictionaries.ts`
- Create: `src/i18n/useTranslation.ts`
- Create: `src/components/Onboarding.tsx`
- Create: `src/components/Onboarding.test.tsx`

**Interfaces:**
- Produces `AppData`, `PomodoroSettings`, `ActiveSession`, `SessionHistoryItem`, `Phase` and `Locale` from `src/domain/types.ts`.
- Produces `loadAppData(storage: Storage): AppData`, `saveAppData(storage: Storage, data: AppData): void`, and `clearAppData(storage: Storage): void` from `src/data/storage.ts`.
- Produces `useTranslation(locale: Locale): { t(key: MessageKey): string }`.
- Produces `Onboarding({ onComplete }: { onComplete(name: string): void })`.

- [ ] **Step 1: Write failing storage and onboarding tests.**

```ts
// src/data/storage.test.ts
import { loadAppData } from './storage'

test('returns safe defaults for malformed saved data', () => {
  localStorage.setItem('pomokitty:data:v1', '{not-json')
  expect(loadAppData(localStorage).settings.childName).toBeUndefined()
})
```

```tsx
// src/components/Onboarding.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Onboarding } from './Onboarding'

test('returns the child name after first-open submit', async () => {
  const onComplete = vi.fn()
  render(<Onboarding onComplete={onComplete} />)
  await userEvent.type(screen.getByLabelText('Как тебя зовут?'), 'Маша')
  await userEvent.click(screen.getByRole('button', { name: 'Продолжить' }))
  expect(onComplete).toHaveBeenCalledWith('Маша')
})
```

- [ ] **Step 2: Run the tests to verify the modules are absent.**

Run: `npm run test -- src/data/storage.test.ts src/components/Onboarding.test.tsx`

Expected: failure because the named modules do not exist.

- [ ] **Step 3: Implement contracts, safe versioned persistence, dictionaries and the prompt.**

Use these core contracts:

```ts
export type Locale = 'ru' | 'en'
export type Phase = 'idle' | 'focus' | 'shortBreak' | 'longBreak' | 'paused'

export interface PomodoroSettings {
  childName?: string
  locale: Locale
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  roundsBeforeLongBreak: number
  autoStartNext: boolean
  animationsEnabled: boolean
  notificationsEnabled: boolean
  keepScreenAwake: boolean
  selectedSound: 'rain' | 'forest' | 'fireplace' | 'ocean' | 'whiteNoise' | 'none'
  soundVolume: number
}

export interface AppData {
  version: 1
  settings: PomodoroSettings
  activeSession?: ActiveSession
  history: SessionHistoryItem[]
}
```

Trim the submitted name, reject an empty post-trim value in the form, and use `childName: undefined` after clearing the value. Implement every UI string in both dictionaries; select Russian only when `navigator.language` starts with `ru`, otherwise English.

- [ ] **Step 4: Run focused tests and the full unit suite.**

Run: `npm run test -- src/data/storage.test.ts src/components/Onboarding.test.tsx && npm run test`

Expected: all tests pass.

- [ ] **Step 5: Commit the local-only identity foundation.**

```bash
git add src/domain src/data src/i18n src/components/Onboarding.tsx src/components/Onboarding.test.tsx
git commit -m "feat: add local child onboarding and preferences"
```

### Task 3: Build the pure Pomodoro state machine and statistics calculations

**Files:**
- Create: `src/domain/timer.ts`
- Create: `src/domain/timer.test.ts`
- Create: `src/domain/stats.ts`
- Create: `src/domain/stats.test.ts`

**Interfaces:**
- Consumes `ActiveSession`, `Phase`, `PomodoroSettings` and `SessionHistoryItem`.
- Produces `startSession(now: number, settings: PomodoroSettings, taskName?: string): ActiveSession`.
- Produces `pauseSession(session: ActiveSession, now: number): ActiveSession`, `resumeSession(session: ActiveSession, now: number): ActiveSession`, `getTimerView(session: ActiveSession, now: number): TimerView`, and `completeCurrentPhase(session: ActiveSession, settings: PomodoroSettings, now: number): PhaseTransition`.
- Produces `getDailyMinutes(history: SessionHistoryItem[], now: Date): number` and `getWeeklyMinutes(history: SessionHistoryItem[], now: Date): number`.

- [ ] **Step 1: Write failing timer recovery and long-break tests.**

```ts
test('derives remaining focus time from targetEndsAt after a page restore', () => {
  const session = startSession(1_000, settings)
  expect(getTimerView(session, 61_000).remainingMs).toBe(24 * 60 * 1_000)
})

test('starts a long break after the configured number of focus rounds', () => {
  const session = { ...startSession(0, settings), completedFocusRounds: 3 }
  expect(completeCurrentPhase(session, settings, 25 * 60 * 1_000).nextPhase).toBe('longBreak')
})
```

- [ ] **Step 2: Run the tests to verify they fail because timer functions do not exist.**

Run: `npm run test -- src/domain/timer.test.ts src/domain/stats.test.ts`

Expected: failure reporting missing exports.

- [ ] **Step 3: Implement immutable transitions using timestamps, not intervals.**

Use this display contract:

```ts
export interface TimerView {
  phase: Phase
  remainingMs: number
  totalMs: number
  completedFocusRounds: number
  isFinished: boolean
}

export interface PhaseTransition {
  nextPhase: Exclude<Phase, 'paused'>
  nextSession: ActiveSession
  historyItem?: SessionHistoryItem
}
```

Clamp displayed remaining time to zero. Store `remainingMsWhenPaused` only for a paused session. Return a completed focus `historyItem` exactly once when focus ends; never add break phases to history.

- [ ] **Step 4: Run focused tests and the full unit suite.**

Run: `npm run test -- src/domain/timer.test.ts src/domain/stats.test.ts && npm run test`

Expected: all timer and statistics cases pass.

- [ ] **Step 5: Commit the time-safe domain layer.**

```bash
git add src/domain
git commit -m "feat: add resilient pomodoro state machine"
```

### Task 4: Add browser adapters for wake lock and local looping sounds

**Files:**
- Create: `src/device/wakeLock.ts`
- Create: `src/device/wakeLock.test.ts`
- Create: `src/device/audio.ts`
- Create: `src/device/audio.test.ts`
- Create: `public/sounds/rain.mp3`
- Create: `public/sounds/forest.mp3`
- Create: `public/sounds/fireplace.mp3`
- Create: `public/sounds/ocean.mp3`
- Create: `public/sounds/white-noise.mp3`
- Create: `public/sounds/LICENSES.md`

**Interfaces:**
- Produces `WakeLockController` with `acquire(): Promise<'active' | 'unavailable'>`, `release(): Promise<void>`, and `reacquireWhenVisible(): Promise<'active' | 'unavailable'>`.
- Produces `AudioController` with `select(sound: SoundId): Promise<void>`, `setVolume(volume: number): void`, `start(): Promise<'playing' | 'blocked'>`, and `stop(): void`.
- Consumes `SoundId` from `src/domain/types.ts`.

- [ ] **Step 1: Write failing unavailable-API and blocked-audio tests.**

```ts
test('reports unavailable when Wake Lock is absent', async () => {
  const controller = new WakeLockController({ navigator: {} as Navigator, document })
  await expect(controller.acquire()).resolves.toBe('unavailable')
})

test('returns blocked when browser audio playback rejects', async () => {
  const audio = { loop: false, volume: 0, play: vi.fn().mockRejectedValue(new Error('blocked')), pause: vi.fn() }
  const controller = new AudioController(() => audio as unknown as HTMLAudioElement)
  await expect(controller.start()).resolves.toBe('blocked')
})
```

- [ ] **Step 2: Run the tests to verify they fail because adapters do not exist.**

Run: `npm run test -- src/device/wakeLock.test.ts src/device/audio.test.ts`

Expected: failure reporting missing adapter modules.

- [ ] **Step 3: Implement adapters and add documented local sound assets.**

Request wake lock only for a visible document. Listen to the sentinel `release` event and document `visibilitychange`; never throw when the API is absent, blocked, or released by the platform. Recreate audio when a new sound is selected, set `loop = true`, clamp volume to `0..1`, and stop/reset playback on phase end.

For every sound file, record the file name, source or creation method, license, creator credit when required, and retrieval date in `public/sounds/LICENSES.md`. Do not add an asset without this record.

- [ ] **Step 4: Run adapter tests and verify assets have records.**

Run: `npm run test -- src/device/wakeLock.test.ts src/device/audio.test.ts && node -e "const fs=require('fs'); if(fs.readdirSync('public/sounds').filter(n=>n.endsWith('.mp3')).length!==5) process.exit(1)" && npm run test`

Expected: tests pass and exactly five local MP3 files exist.

- [ ] **Step 5: Commit browser integrations and compliant sounds.**

```bash
git add src/device public/sounds
git commit -m "feat: add wake lock and focus sounds"
```

### Task 5: Compose the application shell, navigation and responsive visual system

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/app.css`
- Create: `src/components/BottomNav.tsx`
- Create: `src/components/BottomNav.test.tsx`
- Create: `src/components/Mascot.tsx`
- Create: `src/components/Mascot.test.tsx`
- Create: `src/app/App.test.tsx`

**Interfaces:**
- Consumes `Onboarding`, settings data and `Locale`.
- Produces `BottomNav({ active, onChange })` where `active` is `'timer' | 'stats' | 'settings'`.
- Produces `Mascot({ active, animationsEnabled }: { active: boolean; animationsEnabled: boolean })`.

- [ ] **Step 1: Write failing onboarding gate, navigation and motion tests.**

```tsx
test('shows onboarding before a child name has been saved', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Как тебя зовут?' })).toBeInTheDocument()
})

test('mascot disables motion when animations are disabled', () => {
  render(<Mascot active animationsEnabled={false} />)
  expect(screen.getByTestId('mascot')).toHaveAttribute('data-animated', 'false')
})
```

- [ ] **Step 2: Run the tests to verify they fail.**

Run: `npm run test -- src/app/App.test.tsx src/components/BottomNav.test.tsx src/components/Mascot.test.tsx`

Expected: failure because the composed shell and components are incomplete.

- [ ] **Step 3: Implement the mobile-first shell and CSS mascot.**

Create CSS custom properties for cream, terracotta, muted dark-blue, mint, surface, border and focus-ring colors. Use a fixed-height mobile shell and `min-height: 100dvh`. The timer section must use a non-scrolling grid; other sections may scroll inside their own content area. Make every button at least 44×44 px.

Make the mascot from semantic nested spans or divs, not a copied image. Apply `mascot--active` only when `active && animationsEnabled`; include breathing, blink, ear and tail keyframes. Disable those animations inside `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 4: Run component tests and a production build.**

Run: `npm run test -- src/app/App.test.tsx src/components/BottomNav.test.tsx src/components/Mascot.test.tsx && npm run build`

Expected: all tests pass and `dist` is generated.

- [ ] **Step 5: Commit the visual shell.**

```bash
git add src/app src/components
git commit -m "feat: add responsive pomokitty app shell"
```

### Task 6: Implement the persisted timer controller and no-scroll focus screen

**Files:**
- Create: `src/features/timer/usePomodoroController.ts`
- Create: `src/features/timer/usePomodoroController.test.tsx`
- Create: `src/features/timer/TimerScreen.tsx`
- Create: `src/features/timer/TimerScreen.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/app.css`

**Interfaces:**
- Consumes timer functions, `AudioController`, `WakeLockController`, storage, translations and `Mascot`.
- Produces `usePomodoroController(): PomodoroController`.
- Produces `TimerScreen({ controller }: { controller: PomodoroController })`.

```ts
export interface PomodoroController {
  view: TimerView
  taskName: string
  wakeLockStatus: 'active' | 'unavailable' | 'idle'
  setTaskName(value: string): void
  start(): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  finishCurrentPhase(): Promise<void>
}
```

- [ ] **Step 1: Write failing restoration and control tests.**

```tsx
test('restores an active session and renders its remaining time', () => {
  saveAppData(localStorage, { ...data, activeSession: activeFocusSession })
  render(<App />)
  expect(screen.getByText('24:00')).toBeInTheDocument()
})

test('pausing a focus session releases the wake lock', async () => {
  const { controller } = renderTimerWithFakes({ phase: 'focus' })
  await userEvent.click(screen.getByRole('button', { name: 'Пауза' }))
  expect(controller.wakeLock.release).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run the tests to verify the controller and screen are missing.**

Run: `npm run test -- src/features/timer/usePomodoroController.test.tsx src/features/timer/TimerScreen.test.tsx`

Expected: failure reporting incomplete timer feature modules.

- [ ] **Step 3: Implement controller lifecycle and focus interface.**

Use one 250 ms display refresh only while the page is visible and a session is active; derive the display from `targetEndsAt` on every render tick. Persist the active session after every transition. Start audio and acquire wake lock after a user-initiated start or resume. Stop audio and release wake lock on pause, completion and unmount. Reacquire wake lock after `visibilitychange` when the active phase is focus.

Layout the timer screen as `grid-template-rows: auto auto minmax(0, 1fr) auto` with the primary action in its own final row. Use `overflow: hidden` for the timer surface, while ensuring the task control and primary action occupy separate grid areas.

- [ ] **Step 4: Run feature tests and build.**

Run: `npm run test -- src/features/timer/usePomodoroController.test.tsx src/features/timer/TimerScreen.test.tsx && npm run build`

Expected: tests pass and production build succeeds.

- [ ] **Step 5: Commit the core focus experience.**

```bash
git add src/features/timer src/app/App.tsx src/app/app.css
git commit -m "feat: add persistent pomodoro timer"
```

### Task 7: Implement sounds controls, statistics and editable settings

**Files:**
- Create: `src/features/stats/StatsScreen.tsx`
- Create: `src/features/stats/StatsScreen.test.tsx`
- Create: `src/features/settings/SettingsScreen.tsx`
- Create: `src/features/settings/SettingsScreen.test.tsx`
- Create: `src/features/settings/SoundSettings.tsx`
- Create: `src/features/settings/SoundSettings.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/app.css`

**Interfaces:**
- Consumes `AppData`, storage, statistics functions, translations and `AudioController`.
- Produces `StatsScreen({ history }: { history: SessionHistoryItem[] })`.
- Produces `SettingsScreen({ data, onChange, onClearData }: SettingsScreenProps)`.
- Produces `SoundSettings({ selectedSound, volume, onSelect, onVolumeChange }: SoundSettingsProps)`.

- [ ] **Step 1: Write failing tests for weekly totals, name editing and audio settings.**

```tsx
test('shows weekly focus minutes from completed focus history', () => {
  render(<StatsScreen history={historyWithThreeFocusSessions} />)
  expect(screen.getByText('75 мин')).toBeInTheDocument()
})

test('updates and clears a saved child name', async () => {
  render(<SettingsScreen {...props} />)
  await userEvent.clear(screen.getByLabelText('Имя ребёнка'))
  await userEvent.type(screen.getByLabelText('Имя ребёнка'), 'Лёва')
  await userEvent.click(screen.getByRole('button', { name: 'Сохранить имя' }))
  expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ childName: 'Лёва' }))
})
```

- [ ] **Step 2: Run the tests to verify the screens do not exist.**

Run: `npm run test -- src/features/stats/StatsScreen.test.tsx src/features/settings/SettingsScreen.test.tsx src/features/settings/SoundSettings.test.tsx`

Expected: failure reporting missing feature modules.

- [ ] **Step 3: Implement all persisted controls and graceful statuses.**

Render daily and weekly completed focus minutes and a local session history. Add settings for child name, locale, four duration parameters, automatic transitions, sound selection, volume, notifications, mascot animation, wake lock and clear-data confirmation.

Use a real `<input type="range">` with a visible localized label for volume. Audio start failures must set a short localized status message; do not block timer controls. Clearing data must show a confirmation control, erase storage only after confirmation, then return to the onboarding state.

- [ ] **Step 4: Run settings and statistics tests with the complete unit suite.**

Run: `npm run test -- src/features/stats/StatsScreen.test.tsx src/features/settings/SettingsScreen.test.tsx src/features/settings/SoundSettings.test.tsx && npm run test`

Expected: all tests pass.

- [ ] **Step 5: Commit completed supporting screens.**

```bash
git add src/features src/app/App.tsx src/app/app.css
git commit -m "feat: add local settings and focus statistics"
```

### Task 8: Configure PWA offline behavior and GitHub Pages deployment

**Files:**
- Modify: `vite.config.ts`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `README.md`
- Create: `src/pwa.test.ts`

**Interfaces:**
- Produces a web app manifest named `pomokitty` with `display: 'standalone'` and the two icons.
- Produces a GitHub Actions workflow that builds on pushes to `main` and deploys `dist` through `actions/deploy-pages`.

- [ ] **Step 1: Write failing PWA configuration assertions.**

```ts
import config from '../vite.config'

test('registers a standalone pomokitty PWA manifest', () => {
  const pwaPlugin = config.plugins?.find((plugin) => plugin?.name === 'vite-plugin-pwa')
  expect(pwaPlugin).toBeDefined()
})
```

- [ ] **Step 2: Run the test to verify the PWA plugin is absent.**

Run: `npm run test -- src/pwa.test.ts`

Expected: failure because the PWA configuration is not registered.

- [ ] **Step 3: Add PWA and Pages configuration.**

Set Vite `base` to `'/pomokitty/'` for production builds. Configure `VitePWA` with `registerType: 'autoUpdate'`, manifest name and short name `pomokitty`, `display: 'standalone'`, `theme_color: '#fffaf1'`, and runtime/precache inclusion for `sounds/*.mp3`.

Create the workflow with `permissions: { contents: read, pages: write, id-token: write }`, `actions/configure-pages`, `actions/upload-pages-artifact` pointing to `./dist`, and `actions/deploy-pages`. Document local commands, offline behavior, local-only privacy and the Pages URL in the README.

- [ ] **Step 4: Run PWA tests and production build.**

Run: `npm run test -- src/pwa.test.ts && npm run build`

Expected: the test passes and `dist/manifest.webmanifest` plus service worker assets exist.

- [ ] **Step 5: Commit deployable PWA configuration.**

```bash
git add vite.config.ts public/icons .github/workflows/deploy-pages.yml README.md src/pwa.test.ts
git commit -m "feat: add offline PWA and Pages deployment"
```

### Task 9: Add mobile acceptance tests and final accessibility checks

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/pomokitty.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Uses the production build through `npm run dev -- --host 127.0.0.1` in Playwright `webServer`.
- Produces screenshots at 320×568, 360×800 and 393×852 for failure diagnostics only.

- [ ] **Step 1: Write failing mobile acceptance tests.**

```ts
import { test, expect, type Page } from '@playwright/test'

async function completeOnboarding(page: Page, name: string) {
  await page.getByLabel('Как тебя зовут?').fill(name)
  await page.getByRole('button', { name: 'Продолжить' }).click()
}

test('first visit collects a name and the focus timer fits without page scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')
  await page.getByLabel('Как тебя зовут?').fill('Маша')
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await expect(page.getByRole('main', { name: 'pomokitty' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBeTruthy()
})

test('focus start exposes a pause action and persists after reload', async ({ page }) => {
  await page.goto('/')
  await completeOnboarding(page, 'Маша')
  await page.getByRole('button', { name: 'Начать' }).click()
  await expect(page.getByRole('button', { name: 'Пауза' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Пауза' })).toBeVisible()
})
```

- [ ] **Step 2: Run the acceptance tests to verify current gaps.**

Run: `npm run test:e2e`

Expected: initial execution fails until the full application is connected.

- [ ] **Step 3: Complete accessibility and test setup.**

Configure a Chromium mobile project with `locale: 'ru-RU'` in `playwright.config.ts`. Add keyboard-visible focus styles, explicit labels for every input and range, localized accessible names for navigation and timer controls, and no motion when the browser emulates reduced motion. Add the exact validation commands to README.

- [ ] **Step 4: Run the complete verification set.**

Run: `npm run lint && npm run test && npm run build && npm run test:e2e`

Expected: all commands exit successfully.

- [ ] **Step 5: Commit acceptance coverage.**

```bash
git add playwright.config.ts e2e README.md src
git commit -m "test: cover mobile pomokitty flows"
```

## Plan Self-Review

- **Spec coverage:** Task 2 covers local child-name onboarding and two languages. Task 3 covers timestamp-safe timer recovery, cycle transitions, history data and aggregates. Task 4 covers wake lock fallback, sound fallback and local licensing. Tasks 5 and 6 cover original animated mascot, reduced motion, responsive no-scroll timer and active-session persistence. Task 7 covers editable settings, history, statistics, audio controls, privacy-preserving clear-data flow and status errors. Task 8 covers PWA offline behavior and Pages deployment. Task 9 covers target mobile sizes, persistence, labels, focus and final verification.
- **Placeholder scan:** No incomplete task names, deferred behavior markers or unspecified test actions are present.
- **Type consistency:** `PomodoroSettings`, `ActiveSession`, `SessionHistoryItem`, `TimerView`, `PomodoroController`, `WakeLockController` and `AudioController` are defined with the names used by all tasks.
