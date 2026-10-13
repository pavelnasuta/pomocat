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

test('guides a child through name, local-data disclosure, and personal setup before starting', async () => {
  const onComplete = vi.fn()
  const user = userEvent.setup()

  render(<Onboarding onComplete={onComplete} />)

  expect(screen.getByRole('heading', { name: 'Привет! Я pomokitty' })).toBeInTheDocument()
  await user.type(screen.getByLabelText('Как тебя зовут?'), '  Маша  ')
  await user.click(screen.getByRole('button', { name: 'Дальше' }))

  expect(onComplete).not.toHaveBeenCalled()
  expect(screen.getByRole('heading', { name: 'Данные остаются здесь' })).toBeInTheDocument()
  expect(screen.getByText(/Мы их не получаем и не передаём/)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Понятно' }))

  expect(screen.getByRole('heading', { name: 'Готово!' })).toBeInTheDocument()
  expect(screen.queryByLabelText('Фокус, минуты')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Океан без птиц' }))
  await user.click(screen.getByRole('button', { name: 'Черничный синий' }))
  await user.click(screen.getByRole('button', { name: 'Начать первую сессию' }))

  expect(onComplete).toHaveBeenCalledWith({ childName: 'Маша', selectedSound: 'ocean', theme: 'blueberry' })
})

test('rejects an empty child name before leaving the first step', async () => {
  const onComplete = vi.fn()
  const user = userEvent.setup()

  render(<Onboarding onComplete={onComplete} />)
  await user.type(screen.getByLabelText('Как тебя зовут?'), '   ')
  await user.click(screen.getByRole('button', { name: 'Дальше' }))

  expect(onComplete).not.toHaveBeenCalled()
  expect(screen.getByRole('alert')).toHaveTextContent('Введи, пожалуйста, своё имя.')
  expect(screen.queryByRole('heading', { name: 'Данные остаются здесь' })).not.toBeInTheDocument()
})

test('uses the persisted English locale for onboarding copy', () => {
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
    render(<Onboarding onComplete={vi.fn()} />)

    expect(screen.getByRole('heading', { name: "Hi, I'm pomokitty" })).toBeInTheDocument()
    expect(screen.getByLabelText('What is your name?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
  } finally {
    localStorage.clear()
    if (languageDescriptor) {
      Object.defineProperty(navigator, 'language', languageDescriptor)
    }
  }
})