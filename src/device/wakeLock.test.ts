import { vi } from 'vitest'

import { WakeLockController } from './wakeLock'

test('reports unavailable when Wake Lock is absent', async () => {
  const controller = new WakeLockController({ navigator: {} as Navigator, document })

  await expect(controller.acquire()).resolves.toBe('unavailable')
})

test('does not request a Wake Lock while the document is hidden', async () => {
  const visibilityDescriptor = Object.getOwnPropertyDescriptor(document, 'visibilityState')
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
  const request = vi.fn()
  const controller = new WakeLockController({
    navigator: { wakeLock: { request } } as unknown as Navigator,
    document,
  })

  try {
    await expect(controller.acquire()).resolves.toBe('unavailable')
    expect(request).not.toHaveBeenCalled()
  } finally {
    if (visibilityDescriptor) {
      Object.defineProperty(document, 'visibilityState', visibilityDescriptor)
    } else {
      delete (document as unknown as { visibilityState?: DocumentVisibilityState }).visibilityState
    }
  }
})

test('releases an acquired Wake Lock', async () => {
  const sentinel = { addEventListener: vi.fn(), release: vi.fn().mockResolvedValue(undefined) }
  const controller = new WakeLockController({
    navigator: { wakeLock: { request: vi.fn().mockResolvedValue(sentinel) } } as unknown as Navigator,
    document,
  })

  await controller.acquire()
  await controller.release()

  expect(sentinel.release).toHaveBeenCalledOnce()
})

test('reacquires after the browser releases the active Wake Lock', async () => {
  let onRelease: (() => void) | undefined
  const sentinel = {
    addEventListener: vi.fn((_event: string, listener: () => void) => {
      onRelease = listener
    }),
    release: vi.fn().mockResolvedValue(undefined),
  }
  const request = vi.fn().mockResolvedValue(sentinel)
  const controller = new WakeLockController({
    navigator: { wakeLock: { request } } as unknown as Navigator,
    document,
  })

  await controller.acquire()
  onRelease?.()

  await expect(controller.reacquireWhenVisible()).resolves.toBe('active')
  expect(request).toHaveBeenCalledTimes(2)
})

test('reacquires a requested Wake Lock when the document becomes visible', async () => {
  let visibilityState: DocumentVisibilityState = 'hidden'
  let onVisibilityChange: (() => void) | undefined
  const testDocument = {
    addEventListener: vi.fn((_event: string, listener: () => void) => {
      onVisibilityChange = listener
    }),
    get visibilityState() {
      return visibilityState
    },
  } as unknown as Document
  const sentinel = { addEventListener: vi.fn(), release: vi.fn().mockResolvedValue(undefined) }
  const request = vi.fn().mockResolvedValue(sentinel)
  const controller = new WakeLockController({
    navigator: { wakeLock: { request } } as unknown as Navigator,
    document: testDocument,
  })

  await controller.acquire()
  visibilityState = 'visible'
  onVisibilityChange?.()
  await Promise.resolve()

  expect(request).toHaveBeenCalledOnce()
})

test('does not throw when browser Wake Lock release rejects', async () => {
  const sentinel = {
    addEventListener: vi.fn(),
    release: vi.fn().mockRejectedValue(new Error('released by platform')),
  }
  const controller = new WakeLockController({
    navigator: { wakeLock: { request: vi.fn().mockResolvedValue(sentinel) } } as unknown as Navigator,
    document,
  })

  await controller.acquire()

  await expect(controller.release()).resolves.toBeUndefined()
})
