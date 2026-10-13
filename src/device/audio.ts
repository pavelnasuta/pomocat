import type { SoundId } from '../domain/types'

const soundFiles: Partial<Record<Exclude<SoundId, 'none'>, string>> = {
  brownNoise: 'brown-noise.opus',
  forestRain: 'forest-rain.opus',
  ocean: 'ocean.opus',
  nightForest: 'night-forest.opus',
}

export class AudioController {
  private audio?: HTMLAudioElement
  private ambientBuffer?: AudioBuffer
  private ambientContext?: AudioContext
  private ambientGain?: GainNode
  private ambientSource?: AudioBufferSourceNode
  private selectedUrl?: string
  private volume = 1

  constructor(
    private readonly createAudio: (source?: string) => HTMLAudioElement = (source) => new Audio(source),
    private readonly createAudioContext: () => AudioContext | undefined = () => (
      typeof AudioContext === 'undefined' ? undefined : new AudioContext()
    ),
    private readonly fetchAudio: (url: string) => Promise<Response> = (url) => fetch(url),
  ) {}

  private getAmbientContext(): AudioContext | undefined {
    if (this.ambientContext) return this.ambientContext
    try {
      const context = this.createAudioContext()
      if (!context) return undefined
      const gain = context.createGain()
      gain.gain.value = this.volume
      gain.connect(context.destination)
      this.ambientContext = context
      this.ambientGain = gain
      return context
    } catch {
      return undefined
    }
  }

  private stopAmbientSource(): void {
    if (!this.ambientSource) return
    try {
      this.ambientSource.stop()
    } catch {
      // An already stopped source cannot be stopped twice.
    }
    this.ambientSource.disconnect()
    this.ambientSource = undefined
  }

  async select(sound: SoundId): Promise<void> {
    this.stop()
    this.ambientBuffer = undefined

    if (sound === 'none') {
      this.audio = undefined
      this.selectedUrl = undefined
      return
    }

    const soundFile = soundFiles[sound]
    if (!soundFile) {
      this.audio = undefined
      this.selectedUrl = undefined
      return
    }

    const url = `${import.meta.env.BASE_URL}sounds/${soundFile}`
    this.selectedUrl = url
    this.audio = this.createAudio(url)
    this.audio.preload = 'auto'
    this.audio.loop = true

    const context = this.getAmbientContext()
    if (!context) return
    try {
      const response = await this.fetchAudio(url)
      if (!response.ok) return
      const buffer = await context.decodeAudioData(await response.arrayBuffer())
      if (this.selectedUrl === url) this.ambientBuffer = buffer
    } catch {
      // Keep the HTML audio element as a compatibility fallback.
    }
  }

  async playCompletionSound(volume: number): Promise<'playing' | 'blocked'> {
    const chime = this.createAudio(`${import.meta.env.BASE_URL}sounds/ding.mp3`)
    chime.loop = false
    chime.volume = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0

    return new Promise((resolve) => {
      let settled = false
      const finish = (status: 'playing' | 'blocked') => {
        if (settled) return
        settled = true
        window.clearTimeout(fallback)
        resolve(status)
      }
      const fallback = window.setTimeout(() => finish('playing'), 2_000)
      const play = () => void chime.play().then(() => {
        if (typeof chime.addEventListener !== 'function') finish('playing')
      }, () => finish('blocked'))
      if (typeof chime.addEventListener === 'function') {
        chime.addEventListener('ended', () => finish('playing'), { once: true })
      }
      play()
    })
  }

  setVolume(volume: number): void {
    this.volume = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0
    if (this.audio) this.audio.volume = this.volume
    if (this.ambientGain) this.ambientGain.gain.value = this.volume
  }

  stop(): void {
    this.stopAmbientSource()
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
    }
  }

  async start(): Promise<'playing' | 'blocked'> {
    const context = this.ambientContext
    if (context && this.ambientGain && this.ambientBuffer) {
      try {
        await context.resume()
        this.stopAmbientSource()
        const source = context.createBufferSource()
        source.buffer = this.ambientBuffer
        source.loop = true
        source.connect(this.ambientGain)
        source.start()
        this.ambientSource = source
        return 'playing'
      } catch {
        this.stopAmbientSource()
      }
    }

    try {
      await (this.audio ??= this.createAudio()).play()
      return 'playing'
    } catch {
      return 'blocked'
    }
  }
}
