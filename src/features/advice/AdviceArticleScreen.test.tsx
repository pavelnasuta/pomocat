import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdviceArticleScreen } from './AdviceArticleScreen'

test('shows the selected article with an EPS cat illustration and a return button', async () => {
  const onBack = vi.fn()
  const user = userEvent.setup()
  render(<AdviceArticleScreen article="start" locale="ru" onBack={onBack} />)

  expect(screen.getByRole('heading', { name: 'Как начать без уговоров' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Котик помогает начать' })).toBeInTheDocument()
  expect(screen.getByText(/Сделай вход в задачу маленьким/)).toBeInTheDocument()
  expect(screen.getByRole('article').querySelectorAll('p')).toHaveLength(3)
  await user.click(screen.getByRole('button', { name: 'Назад' }))

  expect(onBack).toHaveBeenCalledOnce()
})

test('explains how to install pomokitty as an app from the usage guide', () => {
  const onBack = vi.fn()
  render(<AdviceArticleScreen article="pomodoro" locale="ru" onBack={onBack} />)

  expect(screen.getByText(/iPhone или iPad: открой pomokitty в Safari/)).toBeInTheDocument()
  expect(screen.getByText(/Android: открой pomokitty в Chrome/)).toBeInTheDocument()
  expect(screen.getByRole('article').querySelectorAll('p')).toHaveLength(5)
})
