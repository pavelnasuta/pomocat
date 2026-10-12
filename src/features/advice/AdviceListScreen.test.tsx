import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdviceListScreen } from './AdviceListScreen'

test('shows a Russian list of practical time-management articles for children', async () => {
  const onOpen = vi.fn()
  const user = userEvent.setup()
  render(<AdviceListScreen locale="ru" onOpen={onOpen} />)

  expect(screen.getByRole('heading', { name: 'Советы для продуктивного дня' })).toBeInTheDocument()
  expect(screen.getByRole('list', { name: 'Статьи о времени' })).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(5)
  expect(screen.getByText('Как начать без уговоров')).toBeInTheDocument()
  expect(screen.getByText('Маленькие шаги вместо большой задачи')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /Как начать без уговоров/ }))

  expect(onOpen).toHaveBeenCalledWith('start')
})
