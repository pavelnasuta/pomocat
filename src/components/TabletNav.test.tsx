import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TabletNav } from './TabletNav'

test('keeps timer, advice and settings in tablet navigation without a separate statistics destination', async () => {
  const onChange = vi.fn()
  const user = userEvent.setup()

  render(<TabletNav active="timer" locale="ru" onChange={onChange} />)

  expect(screen.getByRole('button', { name: 'Таймер' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Советы' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Настройки' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Статистика' })).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Советы' }))
  expect(onChange).toHaveBeenCalledWith('advice')
})
