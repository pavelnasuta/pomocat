import { NotificationController } from './notifications'

test('requests permission only when explicitly asked and notifies only when granted', async () => {
  const requestPermission = vi.fn().mockResolvedValue('granted')
  const create = vi.fn()
  const notifications = new NotificationController({ permission: 'default', requestPermission }, create)

  expect(requestPermission).not.toHaveBeenCalled()
  expect(await notifications.requestPermission()).toBe('granted')
  notifications.notify('Focus complete', 'Time for a break')

  expect(requestPermission).toHaveBeenCalledOnce()
  expect(create).toHaveBeenCalledWith('Focus complete', { body: 'Time for a break' })
})

test.each(['denied', 'unavailable'] as const)('silently skips notifications when permission is %s', async (permission) => {
  const create = vi.fn()
  const notifications = new NotificationController(
    permission === 'unavailable' ? undefined : { permission, requestPermission: vi.fn() },
    create,
  )

  expect(await notifications.requestPermission()).toBe(permission === 'unavailable' ? 'unavailable' : 'denied')
  expect(() => notifications.notify('Focus complete', 'Time for a break')).not.toThrow()
  expect(create).not.toHaveBeenCalled()
})
