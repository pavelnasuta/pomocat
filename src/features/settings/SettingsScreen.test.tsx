import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import type { AppData } from '../../domain/types'
import { SettingsScreen } from './SettingsScreen'

function dataWithName(): AppData {
  return {
    version: 1,
    settings: {
      childName: 'Маша',
      locale: 'ru',
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      roundsBeforeLongBreak: 4,
      autoStartNext: false,
      animationsEnabled: true,
      notificationsEnabled: false,
      keepScreenAwake: false,
      selectedSound: 'rain',
      soundVolume: 0.5,
    },
    history: [],
  }
}

function renderSettings(data = dataWithName()) {
  const onChange = vi.fn()
  const onClearData = vi.fn()
  const onRequestNotifications = vi.fn().mockResolvedValue(true)
  render(<SettingsScreen data={data} onChange={onChange} onClearData={onClearData} onRequestNotifications={onRequestNotifications} />)
  return { onChange, onClearData, onRequestNotifications }
}

test('updates and clears a saved child name', async () => {
  const { onChange } = renderSettings()
  const user = userEvent.setup()

  await user.clear(screen.getByLabelText('Имя ребёнка'))
  await user.type(screen.getByLabelText('Имя ребёнка'), 'Лёва')
  const saveButton = screen.getByRole('button', { name: 'Сохранить имя' })
  expect(saveButton).toContainElement(document.querySelector('.lucide-save'))
  expect(saveButton).not.toHaveTextContent('Сохранить имя')
  await user.click(saveButton)

  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ childName: 'Лёва' }))

  await user.clear(screen.getByLabelText('Имя ребёнка'))
  await user.click(screen.getByRole('button', { name: 'Сохранить имя' }))
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ childName: undefined }))
})

test('updates the locale, durations, round count, and automatic transitions', async () => {
  const { onChange } = renderSettings()
  const user = userEvent.setup()

  await user.selectOptions(screen.getByLabelText('Язык'), 'en')
  await user.clear(screen.getByLabelText('Фокус, минуты'))
  await user.type(screen.getByLabelText('Фокус, минуты'), '30')
  await user.clear(screen.getByLabelText('Короткий перерыв, минуты'))
  await user.type(screen.getByLabelText('Короткий перерыв, минуты'), '7')
  await user.clear(screen.getByLabelText('Длинный перерыв, минуты'))
  await user.type(screen.getByLabelText('Длинный перерыв, минуты'), '20')
  await user.clear(screen.getByLabelText('Раундов до длинного перерыва'))
  await user.type(screen.getByLabelText('Раундов до длинного перерыва'), '3')
  await user.click(screen.getByLabelText('Начинать следующий этап автоматически'))

  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
    locale: 'en',
    focusMinutes: 30,
    shortBreakMinutes: 7,
    longBreakMinutes: 20,
    roundsBeforeLongBreak: 3,
    autoStartNext: true,
  }))
})

test.each([
  'Фокус, минуты',
  'Короткий перерыв, минуты',
  'Длинный перерыв, минуты',
  'Раундов до длинного перерыва',
])('does not persist empty or zero values for %s', async (label) => {
  const { onChange } = renderSettings()
  const user = userEvent.setup()
  const input = screen.getByLabelText(label)

  await user.clear(input)

  expect(input).toHaveValue(null)
  expect(onChange).not.toHaveBeenCalled()

  await user.type(input, '0')

  expect(input).toHaveValue(0)
  expect(onChange).not.toHaveBeenCalled()
})

test('selects an application color from the visual color settings', async () => {
  const { onChange } = renderSettings()
  const user = userEvent.setup()

  await user.click(screen.getByLabelText('Черничный синий'))

  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ theme: 'blueberry' }))
})

test('requires permission from the explicit notification setting action', async () => {
  const data = dataWithName()
  const onChange = vi.fn()
  const onRequestNotifications = vi.fn().mockResolvedValue(false)
  render(<SettingsScreen data={data} onChange={onChange} onClearData={vi.fn()} onRequestNotifications={onRequestNotifications} />)
  const user = userEvent.setup()

  await user.click(screen.getByLabelText('Показывать уведомления'))

  expect(onRequestNotifications).toHaveBeenCalledOnce()
  expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ notificationsEnabled: true }))
})

test('updates notifications and wake lock preferences without showing a mascot animation toggle', async () => {
  const { onChange } = renderSettings()
  const user = userEvent.setup()

  expect(screen.queryByLabelText('Анимация котика')).not.toBeInTheDocument()
  await user.click(screen.getByLabelText('Показывать уведомления'))
  await user.click(screen.getByLabelText('Не выключать экран во время фокуса'))

  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
    notificationsEnabled: true,
    keepScreenAwake: true,
  }))
})

test('renders a share action and the idea-and-implementation credit above data deletion', async () => {
  const { onClearData } = renderSettings()
  const share = vi.fn().mockResolvedValue(undefined)
  const descriptor = Object.getOwnPropertyDescriptor(navigator, 'share')
  Object.defineProperty(navigator, 'share', { configurable: true, value: share })
  const user = userEvent.setup()

  try {
    await user.click(screen.getByRole('button', { name: 'Поделиться с другом' }))

    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'pomokitty', url: window.location.href }))
    expect(screen.getByRole('link', { name: '@pavelnasuta' })).toHaveAttribute('href', 'https://t.me/pavelnasuta')
    expect(screen.getByRole('link', { name: 'НИИ МОЗГИ' })).toHaveAttribute('href', 'https://t.me/niimozgii')
    expect(screen.getByText('Идея и реализация')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Очистить все данные' })).toBeInTheDocument()
    expect(onClearData).not.toHaveBeenCalled()
  } finally {
    if (descriptor) Object.defineProperty(navigator, 'share', descriptor)
    else Reflect.deleteProperty(navigator, 'share')
  }
})

test('requires explicit confirmation before clearing saved data', async () => {
  const { onClearData } = renderSettings()
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: 'Очистить все данные' }))
  expect(onClearData).not.toHaveBeenCalled()
  expect(screen.getByText('Это удалит все настройки и историю с этого устройства.')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Да, очистить данные' }))
  expect(onClearData).toHaveBeenCalledOnce()
})
