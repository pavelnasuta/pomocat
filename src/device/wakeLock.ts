type WakeLockSentinel = {
  addEventListener(type: 'release', listener: () => void): void
  release(): Promise<void>
}

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request(type: 'screen'): Promise<WakeLockSentinel>
  }
}

export class WakeLockController {
  private sentinel?: WakeLockSentinel
  private wantsWakeLock = false
  private acquisition?: Promise<'active' | 'unavailable'>

  constructor(private readonly environment: { navigator: Navigator; document: Document }) {
    environment.document.addEventListener('visibilitychange', () => {
      if (this.wantsWakeLock && environment.document.visibilityState === 'visible') {
        void this.reacquireWhenVisible()
      }
    })
  }

  async acquire(): Promise<'active' | 'unavailable'> {
    this.wantsWakeLock = true
    const wakeLock = (this.environment.navigator as WakeLockNavigator).wakeLock

    if (this.environment.document.visibilityState !== 'visible' || !wakeLock) {
      return 'unavailable'
    }

    if (this.sentinel) {
      return 'active'
    }

    if (this.acquisition) {
      return this.acquisition
    }

    const acquisition = wakeLock
      .request('screen')
      .then(async (sentinel) => {
        if (!this.wantsWakeLock) {
          await this.releaseSentinel(sentinel)
          return 'unavailable' as const
        }

        this.sentinel = sentinel
        sentinel.addEventListener('release', () => {
          if (this.sentinel === sentinel) {
            this.sentinel = undefined
          }
        })
        return 'active' as const
      })
      .catch(() => 'unavailable' as const)

    this.acquisition = acquisition
    void acquisition.finally(() => {
      if (this.acquisition === acquisition) {
        this.acquisition = undefined
      }
    })
    return acquisition
  }

  async reacquireWhenVisible(): Promise<'active' | 'unavailable'> {
    return this.acquire()
  }

  async release(): Promise<void> {
    this.wantsWakeLock = false
    const sentinel = this.sentinel
    this.sentinel = undefined
    const acquisition = this.acquisition

    if (sentinel) {
      await this.releaseSentinel(sentinel)
    }

    if (acquisition) {
      await acquisition
    }
  }

  private async releaseSentinel(sentinel: WakeLockSentinel): Promise<void> {
    try {
      await sentinel.release()
    } catch {
      // Wake Lock release must not interrupt the timer when the browser rejects it.
    }
  }
}
