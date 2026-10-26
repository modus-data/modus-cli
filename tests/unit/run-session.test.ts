import type { Modus } from '@getmodus/sdk'
import { describe, expect, it, vi } from 'vitest'
import { activeRunSessionId } from '../../src/run-session.js'

function clientListing(runs: Array<{ runId: string; sessionId: string }>) {
  const active = vi.fn(async () => ({
    async *autoPagingIter() {
      yield* runs
    },
  }))
  return { client: { workflows: { runs: { active } } } as unknown as Modus, active }
}

describe('activeRunSessionId', () => {
  it('uses --session when given, without listing runs', async () => {
    const { client, active } = clientListing([])
    expect(await activeRunSessionId(client, 'run-1', 'thread-1')).toBe('thread-1')
    expect(active).not.toHaveBeenCalled()
  })

  it("finds the run's session in the active runs", async () => {
    const { client } = clientListing([
      { runId: 'run-0', sessionId: 'thread-0' },
      { runId: 'run-1', sessionId: 'thread-1' },
    ])
    expect(await activeRunSessionId(client, 'run-1', undefined)).toBe('thread-1')
  })

  it('is undefined when the run is not active', async () => {
    const { client } = clientListing([{ runId: 'run-0', sessionId: 'thread-0' }])
    expect(await activeRunSessionId(client, 'run-1', ' ')).toBeUndefined()
  })
})
