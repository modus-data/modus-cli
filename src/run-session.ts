import type { Modus } from '@getmodus/sdk'

/**
 * The conversation an active run belongs to: `sessionId` when given, else the run's row in
 * `runs list-active`. Undefined when the run is not listed there (finished, or not the newest
 * turn of its conversation).
 */
export async function activeRunSessionId(
  client: Modus,
  runId: string,
  sessionId: string | undefined,
): Promise<string | undefined> {
  if (sessionId?.trim()) return sessionId
  for await (const run of (await client.workflows.runs.active({ pageSize: 100 })).autoPagingIter()) {
    if (run.runId === runId) return run.sessionId
  }
  return undefined
}
