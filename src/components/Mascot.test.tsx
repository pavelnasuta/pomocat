import { render, screen } from '@testing-library/react'
import { Mascot } from './Mascot'

test('mascot disables motion when animations are disabled', () => {
  render(<Mascot active animationsEnabled={false} locale="en" />)

  expect(screen.getByTestId('mascot')).toHaveAttribute('data-animated', 'false')
})
