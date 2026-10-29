import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConflictError, ModusError, type RunEvent } from '@getmodus/sdk'
import { BaseCommand } from '../../src/base-command.js'

type Command = BaseCommand<typeof BaseCommand> & {
  printRunEvents(events: AsyncIterable<RunEvent>, json: boolean): Promise<void>
}

function command(): { cmd: Command; log: ReturnType<typeof vi.fn> } {
  const log = vi.fn()
  const cmd = Object.create(BaseCommand.prototype) as Command
  Object.assign(cmd, { log })
  return { cmd, log }
}

async function* events(...list: RunEvent[]): AsyncGenerator<RunEvent> {
  yield* list
}

const failed: RunEvent = { type: 'error', message: 'The write is no longer pending.', requestId: 'req_9', id: '7-1' }

describe('a run stream that ends with an error frame', () => {
  afterEach(() => vi.restoreAllMocks())

  it('fails the command with the requestId after printing every frame as NDJSON', async () => {
    const { cmd, log } = command()
    const token: RunEvent = { type: 'token', content: 'hi', id: '7-0' }

    await expect(cmd.printRunEvents(events(token, failed), true)).rejects.toMatchObject({
      message: 'The write is no longer pending.',
      requestId: 'req_9',
    })
    expect(log.mock.calls.map(([line]) => JSON.parse(String(line)))).toEqual([token, failed])
  })

  it('fails the command in text mode too, keeping stdout to the streamed text', async () => {
    const { cmd, log } = command()
    const write = vi.spyOn(process.stdout, 'write').mockReturnValue(true)

    await expect(cmd.printRunEvents(events({ type: 'token', content: 'hi' }, failed), false))
      .rejects.toBeInstanceOf(ModusError)
    expect(write.mock.calls.map(([chunk]) => chunk)).toEqual(['hi', '\n'])
    expect(log).not.toHaveBeenCalled()
  })

  it('succeeds when the run ends with done', async () => {
    const { cmd } = command()
    vi.spyOn(process.stdout, 'write').mockReturnValue(true)
    await expect(cmd.printRunEvents(events({ type: 'done', runId: 'r', threadId: 't' }), false))
      .resolves.toBeUndefined()
  })
})

describe('error output', () => {
  it('prints the code and requestId under the message and keeps the HTTP exit code', async () => {
    const { cmd } = command()
    const error = new ConflictError('No write approval is pending for this conversation.', {
      code: 'CONFLICT',
      requestId: 'req_1',
    })

    await expect(cmd.catch(error)).rejects.toMatchObject({
      message: 'No write approval is pending for this conversation.\ncode: CONFLICT\nrequestId: req_1',
      oclif: { exit: 1 },
    })
  })

  it('prints the traceId, which also names a request that never reached Modus', async () => {
    const { cmd } = command()
    const error = new ModusError('Network error', { traceId: '4bf92f3577b34da6a3ce929d0e0e4736' })
    await expect(cmd.catch(error)).rejects.toMatchObject({
      message: 'Network error\ntraceId: 4bf92f3577b34da6a3ce929d0e0e4736',
    })
  })

  it('omits what the error does not carry', async () => {
    const { cmd } = command()
    await expect(cmd.catch(new ModusError('boom'))).rejects.toMatchObject({ message: 'boom' })
  })
})
