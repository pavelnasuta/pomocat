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

  render(<BottomNav active="timer" onChange={onChange} />)
  await user.click(screen.getByRole('button', { name: 'Статистика' }))

  expect(onChange).toHaveBeenCalledWith('stats')
})
