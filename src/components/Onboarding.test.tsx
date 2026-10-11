import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Onboarding } from './Onboarding'

test('returns the child name after first-open submit', async () => {
  const onComplete = vi.fn()
  const user = userEvent.setup()

  render(<Onboarding onComplete={onComplete} />)
  await user.type(screen.getByLabelText('Как тебя зовут?'), 'Маша')
  await user.click(screen.getByRole('button', { name: 'Продолжить' }))

  expect(onComplete).toHaveBeenCalledWith('Маша')
})

test('trims the child name before submitting', async () => {
  const onComplete = vi.fn()
  const user = userEvent.setup()

  render(<Onboarding onComplete={onComplete} />)
  await user.type(screen.getByLabelText('Как тебя зовут?'), '  Маша  ')
  await user.click(screen.getByRole('button', { name: 'Продолжить' }))

  expect(onComplete).toHaveBeenCalledWith('Маша')
})

test('rejects an empty child name after trimming', async () => {
  const onComplete = vi.fn()
  const user = userEvent.setup()

  render(<Onboarding onComplete={onComplete} />)
  await user.type(screen.getByLabelText('Как тебя зовут?'), '   ')
  await user.click(screen.getByRole('button', { name: 'Продолжить' }))

  expect(onComplete).not.toHaveBeenCalled()
  expect(screen.getByRole('alert')).toHaveTextContent('Введи, пожалуйста, своё имя.')
})
