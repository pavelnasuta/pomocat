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
  await user.click(screen.getByRole('button', { name: 'Сохранить имя' }))

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

test('updates notifications, animation, and wake lock preferences', async () => {
  const { onChange } = renderSettings()
  const user = userEvent.setup()

  await user.click(screen.getByLabelText('Показывать уведомления'))
  await user.click(screen.getByLabelText('Анимация котика'))
  await user.click(screen.getByLabelText('Не выключать экран во время фокуса'))

  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
    notificationsEnabled: true,
    animationsEnabled: false,
    keepScreenAwake: true,
  }))
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
