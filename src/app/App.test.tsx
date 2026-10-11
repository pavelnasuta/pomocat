import { render, screen } from '@testing-library/react'
import { App } from './App'

test('renders the pomokitty application shell', () => {
  render(<App />)
  expect(screen.getByRole('main', { name: 'pomokitty' })).toBeInTheDocument()
})
