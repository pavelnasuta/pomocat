export type NotificationPermissionStatus = 'granted' | 'denied' | 'unavailable'

export interface NotificationApi {
  permission: NotificationPermission
  requestPermission(): Promise<NotificationPermission>
}

type NotificationFactory = (title: string, options: NotificationOptions) => unknown

export class NotificationController {
  private permissionOverride: NotificationPermission | undefined

  constructor(
    private readonly api: NotificationApi | undefined = typeof Notification === 'undefined' ? undefined : Notification,
    private readonly create: NotificationFactory = (title, options) => new Notification(title, options),
  ) {}

  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.api) return 'unavailable'
    if (this.api.permission === 'granted') return 'granted'
    if (this.api.permission === 'denied') return 'denied'
    try {
      this.permissionOverride = await this.api.requestPermission()
      return this.permissionOverride === 'granted' ? 'granted' : 'denied'
    } catch {
      return 'denied'
    }
  }

  notify(title: string, body: string): void {
    if ((this.permissionOverride ?? this.api?.permission) !== 'granted') return
    try {
      this.create(title, { body })
    } catch {
      // System notifications are optional and must never interrupt the timer.
    }
  }
}
