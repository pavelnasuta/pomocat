import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { loadAppData, saveAppData } from '../data/storage'
import { BottomNav } from './BottomNav'

beforeEach(() => {
  localStorage.clear()
  const data = loadAppData(localStorage)
  data.settings.locale = 'ru'
  saveAppData(localStorage, data)
})

test('changes to the selected navigation section', async () => {
  const onChange = vi.fn()
  const user = userEvent.setup()

  render(<BottomNav active="timer" locale="ru" onChange={onChange} />)

  expect(screen.getByTestId('nav-icon-timer')).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByTestId('nav-icon-timer')).toHaveClass('lucide-timer')
  expect(screen.getByTestId('nav-icon-stats')).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByTestId('nav-icon-stats')).toHaveClass('lucide-chart-no-axes-column')
  expect(screen.getByTestId('nav-icon-settings')).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByTestId('nav-icon-settings')).toHaveClass('lucide-settings')
  expect(screen.getByTestId('nav-icon-advice')).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByTestId('nav-icon-advice')).toHaveClass('lucide-book-open')

  await user.click(screen.getByRole('button', { name: 'Советы' }))

  expect(onChange).toHaveBeenCalledWith('advice')
})
