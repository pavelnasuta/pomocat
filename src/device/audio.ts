import type { SoundId } from '../domain/types'

const soundFiles: Partial<Record<Exclude<SoundId, 'none'>, string>> = {
  brownNoise: 'brown-noise.opus',
  forestRain: 'forest-rain.opus',
  ocean: 'ocean.opus',
  nightForest: 'night-forest.opus',
}

export class AudioController {
  private audio?: HTMLAudioElement

  constructor(
    private readonly createAudio: (source?: string) => HTMLAudioElement = (source) => new Audio(source),
  ) {}

  async select(sound: SoundId): Promise<void> {
    this.stop()

    if (sound === 'none') {
      this.audio = undefined
      return
    }

    const soundFile = soundFiles[sound]
    if (!soundFile) {
      this.audio = undefined
      return
    }

    this.audio = this.createAudio(`${import.meta.env.BASE_URL}sounds/${soundFile}`)
    this.audio.preload = 'auto'
    this.audio.loop = true
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
    if (this.audio) {
      this.audio.volume = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
    }
  }

  async start(): Promise<'playing' | 'blocked'> {
    try {
      await (this.audio ??= this.createAudio()).play()
      return 'playing'
    } catch {
      return 'blocked'
    }
  }
}
