import { render, screen } from '@testing-library/react'
import { AdviceListScreen } from './AdviceListScreen'

test('shows a Russian list of practical time-management articles for children', () => {
  render(<AdviceListScreen locale="ru" />)

  expect(screen.getByRole('heading', { name: 'Советы для продуктивного дня' })).toBeInTheDocument()
  expect(screen.getByRole('list', { name: 'Статьи о времени' })).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(5)
  expect(screen.getByText('Как начать без уговоров')).toBeInTheDocument()
  expect(screen.getByText('Маленькие шаги вместо большой задачи')).toBeInTheDocument()
})
