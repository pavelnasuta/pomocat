import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { SoundSettings } from './SoundSettings'

test('renders a visible localized volume label and native range input', () => {
  render(<SoundSettings selectedSound="rain" volume={0.5} onSelect={vi.fn()} onVolumeChange={vi.fn()} />)

  expect(screen.getByLabelText('Громкость: 50%')).toHaveAttribute('type', 'range')
  expect(screen.getByLabelText('Громкость: 50%')).toHaveAttribute('min', '0')
  expect(screen.getByLabelText('Громкость: 50%')).toHaveAttribute('max', '100')
})

test('offers only rain and white noise plus the silent option', async () => {
  const onSelect = vi.fn()
  const onVolumeChange = vi.fn()
  const user = userEvent.setup()
  render(
    <SoundSettings selectedSound="none" volume={0.5} onSelect={onSelect} onVolumeChange={onVolumeChange} />,
  )

  expect(screen.getByLabelText('Фоновый звук')).toHaveValue('none')
  expect(Array.from(screen.getByLabelText('Фоновый звук').querySelectorAll('option')).map((option) => option.value)).toEqual([
    'none',
    'rain',
    'whiteNoise',
  ])
  await user.selectOptions(screen.getByLabelText('Фоновый звук'), 'whiteNoise')
  fireEvent.change(screen.getByLabelText('Громкость: 50%'), { target: { value: '52' } })

  expect(onSelect).toHaveBeenCalledWith('whiteNoise')
  expect(onVolumeChange).toHaveBeenLastCalledWith(0.52)
})

test('uses the effective locale for sound labels', () => {
  render(
    <SoundSettings selectedSound="rain" volume={0.5} onSelect={vi.fn()} onVolumeChange={vi.fn()} locale="en" />,
  )

  expect(screen.getByLabelText('Background sound')).toBeInTheDocument()
  expect(screen.getByLabelText('Volume: 50%')).toBeInTheDocument()
})
