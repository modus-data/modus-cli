import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Config, Parser } from '@oclif/core'
import { describe, expect, it } from 'vitest'
import ContextItemsList from '../../src/commands/context/items/list.js'

const CLI_ROOT = path.join(fileURLToPath(new URL('../..', import.meta.url)))

async function forwardedListOptions(argv: string[]): Promise<unknown> {
  let forwarded: unknown
  class Harness extends ContextItemsList {
    protected override async modusClient() {
      return {
        context: {
          items: {
            list: async (opts: unknown) => {
              forwarded = opts
              return { items: [], nextPageToken: null }
            },
          },
        },
      } as never
    }
  }
  const config = await Config.load(CLI_ROOT)
  await Harness.run(argv, config)
  return forwarded
}

describe('context items list emptyable selector flags', () => {
  it('Parser.parse keeps a sole empty --parent-uid= as [""] on public Command.flags', async () => {
    const parsed = await Parser.parse(['--parent-uid=', '--connection-id', 'files'], {
      flags: ContextItemsList.flags,
      strict: false,
    })
    expect(parsed.flags['parent-uid']).toEqual([''])
    expect(parsed.flags['connection-id']).toEqual(['files'])
    expect(parsed.flags['ancestor-uid']).toBeUndefined()
  })

  it('forwards omitted selectors as undefined', async () => {
    expect(await forwardedListOptions([])).toEqual({
      contextType: undefined,
      parentUids: undefined,
      ancestorUids: undefined,
      connectionIds: undefined,
      pageSize: undefined,
      pageToken: undefined,
    })
  })

  it('forwards a sole empty --parent-uid= as [] (Files root)', async () => {
    expect(await forwardedListOptions(['--connection-id', 'files', '--parent-uid='])).toEqual({
      contextType: undefined,
      parentUids: [],
      ancestorUids: undefined,
      connectionIds: ['files'],
      pageSize: undefined,
      pageToken: undefined,
    })
  })

  it('forwards sole empty --ancestor-uid= and --connection-id= as []', async () => {
    expect(await forwardedListOptions(['--ancestor-uid=', '--connection-id='])).toEqual({
      contextType: undefined,
      parentUids: undefined,
      ancestorUids: [],
      connectionIds: [],
      pageSize: undefined,
      pageToken: undefined,
    })
  })

  it('forwards ordered repeated parent/ancestor/connection chains including whitespace', async () => {
    expect(
      await forwardedListOptions([
        '--parent-uid',
        'db-a',
        '--parent-uid',
        ' PUBLIC ',
        '--ancestor-uid',
        'db-a',
        '--ancestor-uid',
        'PUBLIC',
        '--connection-id',
        'files',
        '--connection-id',
        'conn-a',
      ]),
    ).toEqual({
      contextType: undefined,
      parentUids: ['db-a', ' PUBLIC '],
      ancestorUids: ['db-a', 'PUBLIC'],
      connectionIds: ['files', 'conn-a'],
      pageSize: undefined,
      pageToken: undefined,
    })
  })
})
