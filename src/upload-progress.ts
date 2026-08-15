/** CLI upload progress: hybrid throttle (every N files or every T ms). */

export interface UploadProgressEvent {
  completed: number
  total: number
  succeeded: number
  failed: number
}

export interface ProgressThrottleOptions {
  everyN?: number
  everyMs?: number
  now?: () => number
}

export interface ProgressThrottleState {
  lastReportedCompleted: number
  lastReportedAtMs: number
}

export function createProgressThrottleState(nowMs = 0): ProgressThrottleState {
  return { lastReportedCompleted: 0, lastReportedAtMs: nowMs }
}

/** Whether this progress tick should print a mid-run line (not start/end). */
export function shouldReportProgress(
  event: UploadProgressEvent,
  state: ProgressThrottleState,
  options: ProgressThrottleOptions = {},
): boolean {
  const everyN = options.everyN ?? 25
  const everyMs = options.everyMs ?? 30_000
  const now = options.now?.() ?? Date.now()
  if (event.completed >= event.total) return false
  const byCount = event.completed - state.lastReportedCompleted >= everyN
  const byTime = now - state.lastReportedAtMs >= everyMs
  return byCount || byTime
}

export function markProgressReported(
  event: UploadProgressEvent,
  state: ProgressThrottleState,
  nowMs?: number,
): void {
  state.lastReportedCompleted = event.completed
  state.lastReportedAtMs = nowMs ?? Date.now()
}

export function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export function formatProgressLine(event: UploadProgressEvent, elapsedMs: number): string {
  const stamp = formatElapsed(elapsedMs)
  if (event.completed >= event.total) {
    return `[${stamp}] Done. ${event.succeeded} ok · ${event.failed} failed`
  }
  return `[${stamp}] ${event.completed}/${event.total} done · ${event.succeeded} ok · ${event.failed} failed`
}
