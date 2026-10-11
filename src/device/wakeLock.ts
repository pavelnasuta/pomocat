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

  constructor(private readonly environment: { navigator: Navigator; document: Document }) {
    environment.document.addEventListener('visibilitychange', () => {
      if (this.wantsWakeLock) {
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

    try {
      const sentinel = await wakeLock.request('screen')
      this.sentinel = sentinel
      sentinel.addEventListener('release', () => {
        if (this.sentinel === sentinel) {
          this.sentinel = undefined
        }
      })
      return 'active'
    } catch {
      return 'unavailable'
    }
  }

  async reacquireWhenVisible(): Promise<'active' | 'unavailable'> {
    return this.acquire()
  }

  async release(): Promise<void> {
    this.wantsWakeLock = false
    const sentinel = this.sentinel
    this.sentinel = undefined

    if (!sentinel) {
      return
    }

    try {
      await sentinel.release()
    } catch {
      // Wake Lock release must not interrupt the timer when the browser rejects it.
    }
  }
}
