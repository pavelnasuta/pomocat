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
