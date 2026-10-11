import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { loadAppData, saveAppData } from '../data/storage'
import { Onboarding } from './Onboarding'

beforeEach(() => {
  localStorage.clear()
  const data = loadAppData(localStorage)
  data.settings.locale = 'ru'
  saveAppData(localStorage, data)
})

afterEach(() => {
  localStorage.clear()
})

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

test('uses the persisted English locale for all onboarding strings', async () => {
  const languageDescriptor = Object.getOwnPropertyDescriptor(navigator, 'language')
  Object.defineProperty(navigator, 'language', {
    configurable: true,
    value: 'ru-RU',
  })
  localStorage.clear()
  const data = loadAppData(localStorage)
  data.settings.locale = 'en'
  saveAppData(localStorage, data)

  try {
    const user = userEvent.setup()
    render(<Onboarding onComplete={vi.fn()} />)

    expect(screen.getByLabelText('What is your name?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('What is your name?'), '   ')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter your name.')
  } finally {
    localStorage.clear()
    if (languageDescriptor) {
      Object.defineProperty(navigator, 'language', languageDescriptor)
    }
  }
})
