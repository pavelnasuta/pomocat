import { render, screen } from '@testing-library/react'
import { loadAppData, saveAppData } from '../data/storage'
import { App } from './App'

beforeEach(() => {
  localStorage.clear()
  const data = loadAppData(localStorage)
  data.settings.locale = 'ru'
  saveAppData(localStorage, data)
})

test('shows onboarding before a child name has been saved', () => {
  render(<App />)

  expect(screen.getByRole('heading', { name: 'Как тебя зовут?' })).toBeInTheDocument()
})

test('restores an active session and renders its remaining time', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-11T12:00:00.000Z'))
  const data = loadAppData(localStorage)
  data.settings.childName = 'Маша'
  data.activeSession = {
    phase: 'focus',
    startedAt: new Date(Date.now() - 60_000).toISOString(),
    remainingSeconds: 25 * 60,
    completedRounds: 0,
    targetEndsAt: Date.now() + 24 * 60 * 1_000,
    totalMs: 25 * 60 * 1_000,
  }
  saveAppData(localStorage, data)

  render(<App />)

  expect(screen.getByText('24:00')).toBeInTheDocument()
  vi.useRealTimers()
})

test('persists a setting locale change and passes the effective locale to visible app copy', async () => {
  const data = loadAppData(localStorage)
  data.settings.childName = 'Маша'
  saveAppData(localStorage, data)
  const user = (await import('@testing-library/user-event')).default.setup()

  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Настройки' }))
  await user.selectOptions(screen.getByLabelText('Язык'), 'en')

  expect(screen.getByText('Hello, Маша')).toBeInTheDocument()
  expect(loadAppData(localStorage).settings.locale).toBe('en')
})

test('clears storage only after confirmation and returns to onboarding', async () => {
  const data = loadAppData(localStorage)
  data.settings.childName = 'Маша'
  data.history = [{ id: 'focus', phase: 'focus', durationMinutes: 25, completedAt: '2026-10-11T10:00:00.000Z' }]
  saveAppData(localStorage, data)
  const user = (await import('@testing-library/user-event')).default.setup()

  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Настройки' }))
  await user.click(screen.getByRole('button', { name: 'Очистить все данные' }))
  expect(loadAppData(localStorage).history).toHaveLength(1)
  await user.click(screen.getByRole('button', { name: 'Да, очистить данные' }))

  expect(screen.getByRole('heading')).toHaveTextContent(/Как тебя зовут\?|What is your name\?/)
  expect(loadAppData(localStorage).history).toEqual([])
  expect(loadAppData(localStorage).settings.childName).toBeUndefined()
})
