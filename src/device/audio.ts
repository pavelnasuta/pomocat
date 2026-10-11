import type { SoundId } from '../domain/types'

const soundFiles: Record<Exclude<SoundId, 'none'>, string> = {
  rain: 'rain.mp3',
  forest: 'forest.mp3',
  fireplace: 'fireplace.mp3',
  ocean: 'ocean.mp3',
  whiteNoise: 'white-noise.mp3',
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

    this.audio = this.createAudio(`/sounds/${soundFiles[sound]}`)
    this.audio.loop = true
  }

  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.min(1, Math.max(0, volume))
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
