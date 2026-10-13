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

test('waits for the local non-looping chime to end before resolving a natural period finish', async () => {
  let complete!: () => void
  const chime = {
    loop: true,
    volume: 0,
    pause: vi.fn(),
    addEventListener: vi.fn((_event: string, listener: () => void) => { complete = listener }),
    play: vi.fn().mockResolvedValue(undefined),
  }
  const createAudio = vi.fn(() => chime as unknown as HTMLAudioElement)
  const controller = new AudioController(createAudio)
  const playback = controller.playCompletionSound(0.5)
  let settled = false
  void playback.then(() => { settled = true })

  await Promise.resolve()
  expect(chime.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function), { once: true })
  expect(settled).toBe(false)
  complete()
  await expect(playback).resolves.toBe('playing')

  expect(createAudio).toHaveBeenCalledWith('/sounds/ding.mp3')
  expect(chime.loop).toBe(false)
  expect(chime.volume).toBe(0.5)
  expect(chime.play).toHaveBeenCalledOnce()
})

test('preloads and loops the selected local sound without waiting at its seam', async () => {
  const audio = { loop: false, preload: 'metadata', volume: 0, pause: vi.fn(), play: vi.fn() }
  const createAudio = vi.fn(() => audio as unknown as HTMLAudioElement)
  const controller = new AudioController(createAudio)

  await controller.select('forestRain')

  expect(createAudio).toHaveBeenCalledWith('/sounds/forest-rain.opus')
  expect(audio.preload).toBe('auto')
  expect(audio.loop).toBe(true)
})

test('uses a decoded Web Audio buffer for sample-accurate ambient looping when available', async () => {
  const fallbackAudio = { loop: false, preload: 'metadata', volume: 0, pause: vi.fn(), play: vi.fn().mockResolvedValue(undefined) }
  const source = { buffer: undefined, loop: false, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() }
  const gain = { gain: { value: 0 }, connect: vi.fn() }
  const audioContext = {
    resume: vi.fn().mockResolvedValue(undefined),
    decodeAudioData: vi.fn().mockResolvedValue({}),
    createGain: vi.fn(() => gain),
    createBufferSource: vi.fn(() => source),
    destination: {},
  }
  const fetchAudio = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)) })
  const ControllerWithWebAudio = AudioController as unknown as new (...args: unknown[]) => AudioController
  const controller = new ControllerWithWebAudio(
    () => fallbackAudio as unknown as HTMLAudioElement,
    () => audioContext,
    fetchAudio,
  )

  await controller.select('forestRain')
  await expect(controller.start()).resolves.toBe('playing')

  expect(fetchAudio).toHaveBeenCalledWith('/sounds/forest-rain.opus')
  expect(source.loop).toBe(true)
  expect(source.start).toHaveBeenCalledOnce()
  expect(fallbackAudio.play).not.toHaveBeenCalled()
})

test('resolves selected audio within the Vite Pages base path', async () => {
  vi.stubEnv('BASE_URL', '/pomokitty/')
  vi.resetModules()

  try {
    const { AudioController: PagesAudioController } = await import('./audio')
    const audio = { loop: false, volume: 0, pause: vi.fn(), play: vi.fn() }
    const createAudio = vi.fn(() => audio as unknown as HTMLAudioElement)
    const controller = new PagesAudioController(createAudio)

    await controller.select('forestRain')

    expect(createAudio).toHaveBeenCalledWith('/pomokitty/sounds/forest-rain.opus')
  } finally {
    vi.unstubAllEnvs()
    vi.resetModules()
  }
})

test('clamps the selected audio volume to the browser range', async () => {
  const audio = { loop: false, volume: 0, pause: vi.fn(), play: vi.fn() }
  const controller = new AudioController(() => audio as unknown as HTMLAudioElement)

  await controller.select('forestRain')
  controller.setVolume(3)

  expect(audio.volume).toBe(1)
})

test('normalizes NaN before assigning browser audio volume', async () => {
  const audio = document.createElement('audio')
  const controller = new AudioController(() => audio)

  await controller.select('forestRain')

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

  await controller.select('forestRain')
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

  await controller.select('forestRain')
  await controller.select('brownNoise')

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
    await controller.select('forestRain')

    expect(browserAudio).toHaveBeenCalledWith('/sounds/forest-rain.opus')
  } finally {
    vi.unstubAllGlobals()
  }
})
