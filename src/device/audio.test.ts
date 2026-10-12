import { vi } from 'vitest'

import { AudioController } from './audio'

test('returns blocked when browser audio playback rejects', async () => {
  const audio = {
    loop: false,
    volume: 0,
    play: vi.fn().mockRejectedValue(new Error('blocked')),
    pause: vi.fn(),
  }
  const controller = new AudioController(() => audio as unknown as HTMLAudioElement)

  await expect(controller.start()).resolves.toBe('blocked')
})

test('creates a looping local audio element for the selected sound', async () => {
  const audio = { loop: false, volume: 0, pause: vi.fn(), play: vi.fn() }
  const createAudio = vi.fn(() => audio as unknown as HTMLAudioElement)
  const controller = new AudioController(createAudio)

  await controller.select('whiteNoise')

  expect(createAudio).toHaveBeenCalledWith('/sounds/white-noise.mp3')
  expect(audio.loop).toBe(true)
})

test('resolves selected audio within the Vite Pages base path', async () => {
  vi.stubEnv('BASE_URL', '/pomokitty/')
  vi.resetModules()

  try {
    const { AudioController: PagesAudioController } = await import('./audio')
    const audio = { loop: false, volume: 0, pause: vi.fn(), play: vi.fn() }
    const createAudio = vi.fn(() => audio as unknown as HTMLAudioElement)
    const controller = new PagesAudioController(createAudio)

    await controller.select('rain')

    expect(createAudio).toHaveBeenCalledWith('/pomokitty/sounds/rain.mp3')
  } finally {
    vi.unstubAllEnvs()
    vi.resetModules()
  }
})

test('clamps the selected audio volume to the browser range', async () => {
  const audio = { loop: false, volume: 0, pause: vi.fn(), play: vi.fn() }
  const controller = new AudioController(() => audio as unknown as HTMLAudioElement)

  await controller.select('rain')
  controller.setVolume(3)

  expect(audio.volume).toBe(1)
})

test('normalizes NaN before assigning browser audio volume', async () => {
  const audio = document.createElement('audio')
  const controller = new AudioController(() => audio)

  await controller.select('rain')

  expect(() => controller.setVolume(Number.NaN)).not.toThrow()
  expect(audio.volume).toBe(0)
})

test('plays the selected audio element', async () => {
  const selectedAudio = { loop: false, volume: 0, pause: vi.fn(), play: vi.fn() }
  const fallbackAudio = { loop: false, volume: 0, pause: vi.fn(), play: vi.fn() }
  const createAudio = vi
    .fn()
    .mockReturnValueOnce(selectedAudio as unknown as HTMLAudioElement)
    .mockReturnValueOnce(fallbackAudio as unknown as HTMLAudioElement)
  const controller = new AudioController(createAudio)

  await controller.select('whiteNoise')
  await expect(controller.start()).resolves.toBe('playing')

  expect(selectedAudio.play).toHaveBeenCalledOnce()
  expect(fallbackAudio.play).not.toHaveBeenCalled()
})

test('stops and resets the selected audio at the end of a phase', async () => {
  const audio = { currentTime: 48, loop: false, volume: 0, pause: vi.fn(), play: vi.fn() }
  const controller = new AudioController(() => audio as unknown as HTMLAudioElement)

  await controller.select('rain')
  controller.stop()

  expect(audio.pause).toHaveBeenCalledOnce()
  expect(audio.currentTime).toBe(0)
})

test('stops and replaces audio when the selected sound changes', async () => {
  const previousAudio = { currentTime: 12, loop: false, volume: 0, pause: vi.fn(), play: vi.fn() }
  const replacementAudio = { currentTime: 0, loop: false, volume: 0, pause: vi.fn(), play: vi.fn() }
  const createAudio = vi
    .fn()
    .mockReturnValueOnce(previousAudio as unknown as HTMLAudioElement)
    .mockReturnValueOnce(replacementAudio as unknown as HTMLAudioElement)
  const controller = new AudioController(createAudio)

  await controller.select('rain')
  await controller.select('whiteNoise')

  expect(previousAudio.pause).toHaveBeenCalledOnce()
  expect(previousAudio.currentTime).toBe(0)
  expect(replacementAudio.loop).toBe(true)
})

test('uses the browser Audio constructor by default', async () => {
  const audio = { loop: false, volume: 0, pause: vi.fn(), play: vi.fn() }
  const browserAudio = vi.fn(function BrowserAudio() {
    return audio as unknown as object
  })
  vi.stubGlobal('Audio', browserAudio)

  try {
    const controller = new AudioController()
    await controller.select('rain')

    expect(browserAudio).toHaveBeenCalledWith('/sounds/rain.mp3')
  } finally {
    vi.unstubAllGlobals()
  }
})
