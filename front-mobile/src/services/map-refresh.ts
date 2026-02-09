export type MapRefreshCallback = () => void | Promise<void>

export type MapRefreshOptions = {
  /** Default: 60000 (1 min). Keep it fairly high to avoid excessive Firestore/network usage. */
  intervalMs?: number
  /** Default: true. If true, runs a refresh immediately when started. */
  runImmediately?: boolean
}

/**
 * Simple polling helper intended to be started/stopped from Ionic view lifecycle hooks.
 *
 * Contract:
 * - `start()` schedules refreshes; calling `start()` again resets the timer.
 * - `stop()` cancels any scheduled refresh.
 * - Never runs concurrent refreshes (skips ticks while a refresh is in-flight).
 */
export class MapRefreshService {
  private timer: ReturnType<typeof setInterval> | null = null
  private inFlight = false

  start(cb: MapRefreshCallback, options?: MapRefreshOptions) {
    const intervalMs = options?.intervalMs ?? 600000*6
    const runImmediately = options?.runImmediately ?? true

    this.stop()

    const safeTick = async () => {
      if (this.inFlight) return
      this.inFlight = true
      try {
        await cb()
      } finally {
        this.inFlight = false
      }
    }

    if (runImmediately) {
      // Fire-and-forget; guarded by inFlight.
      void safeTick()
    }

    this.timer = setInterval(() => {
      void safeTick()
    }, intervalMs)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.inFlight = false
  }
}

export const mapRefreshService = new MapRefreshService()

