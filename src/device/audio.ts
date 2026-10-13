import type { SoundId } from '../domain/types'

const soundFiles: Partial<Record<Exclude<SoundId, 'none'>, string>> = {
  brownNoise: 'brown-noise.mp3',
  forestRain: 'forest-rain.mp3',
  ocean: 'ocean.mp3',
  nightForest: 'night-forest.mp3',
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
    this.audio.loop = true
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
