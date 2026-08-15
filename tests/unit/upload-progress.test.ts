import { describe, expect, it } from 'vitest'
import {
  createProgressThrottleState,
  formatElapsed,
  formatProgressLine,
  markProgressReported,
  shouldReportProgress,
} from '../../src/upload-progress.js'

describe('upload progress throttle', () => {
  it('reports when everyN files advance', () => {
    const state = createProgressThrottleState(0)
    expect(
      shouldReportProgress(
        { completed: 24, total: 100, succeeded: 24, failed: 0 },
        state,
        { everyN: 25, everyMs: 30_000, now: () => 1000 },
      ),
    ).toBe(false)
    expect(
      shouldReportProgress(
        { completed: 25, total: 100, succeeded: 25, failed: 0 },
        state,
        { everyN: 25, everyMs: 30_000, now: () => 1000 },
      ),
    ).toBe(true)
  })

  it('reports when everyMs elapses', () => {
    const state = createProgressThrottleState(0)
    expect(
      shouldReportProgress(
        { completed: 3, total: 100, succeeded: 3, failed: 0 },
        state,
        { everyN: 25, everyMs: 30_000, now: () => 29_999 },
      ),
    ).toBe(false)
    expect(
      shouldReportProgress(
        { completed: 3, total: 100, succeeded: 3, failed: 0 },
        state,
        { everyN: 25, everyMs: 30_000, now: () => 30_000 },
      ),
    ).toBe(true)
  })

  it('does not mid-report the final tick (Done line is separate)', () => {
    const state = createProgressThrottleState(0)
    expect(
      shouldReportProgress(
        { completed: 100, total: 100, succeeded: 97, failed: 3 },
        state,
        { everyN: 25, everyMs: 30_000, now: () => 60_000 },
      ),
    ).toBe(false)
  })

  it('markProgressReported advances the baseline', () => {
    const state = createProgressThrottleState(0)
    const event = { completed: 25, total: 100, succeeded: 25, failed: 0 }
    markProgressReported(event, state, 5_000)
    expect(
      shouldReportProgress(
        { completed: 30, total: 100, succeeded: 30, failed: 0 },
        state,
        { everyN: 25, everyMs: 30_000, now: () => 10_000 },
      ),
    ).toBe(false)
    expect(
      shouldReportProgress(
        { completed: 50, total: 100, succeeded: 50, failed: 0 },
        state,
        { everyN: 25, everyMs: 30_000, now: () => 10_000 },
      ),
    ).toBe(true)
  })
})

describe('upload progress formatting', () => {
  it('formats elapsed and mid/final lines', () => {
    expect(formatElapsed(3661000)).toBe('01:01:01')
    expect(formatProgressLine({ completed: 28, total: 100, succeeded: 27, failed: 1 }, 30_000)).toBe(
      '[00:00:30] 28/100 done · 27 ok · 1 failed',
    )
    expect(formatProgressLine({ completed: 100, total: 100, succeeded: 97, failed: 3 }, 82_000)).toBe(
      '[00:01:22] Done. 97 ok · 3 failed',
    )
  })
})
