import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Config } from '@oclif/core'
import { describe, expect, it } from 'vitest'
import ScopesUpdate from '../../src/commands/scopes/update.js'

const CLI_ROOT = path.join(fileURLToPath(new URL('../..', import.meta.url)))

async function forwardedUpdate(argv: string[]): Promise<unknown> {
  let forwarded: unknown
  class Harness extends ScopesUpdate {
    protected override async modusManagement() {
      return {
        scopes: {
          update: async (id: string, options: unknown) => {
            forwarded = { id, options }
            return { id: 42, name: 'Scope' }
          },
        },
      } as never
    }
  }
  const config = await Config.load(CLI_ROOT)
  await Harness.run(argv, config)
  return forwarded
}

describe('scopes update connectionSet file', () => {
  it('forwards { connection_id, path } rows from a JSON file', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'scopes-update-'))
    const file = path.join(dir, 'scope.json')
    const row = { connection_id: '11111111-1111-4111-8111-111111111111', path: [] as string[] }
    await writeFile(file, JSON.stringify({ connectionSet: [row] }))
    const forwarded = await forwardedUpdate(['42', '--file', file])
    expect(forwarded).toEqual({
      id: '42',
      options: expect.objectContaining({
        connectionSet: [{ connection_id: row.connection_id, path: [] }],
      }),
    })
    const options = (forwarded as { options: { connectionSet: unknown[] } }).options
    expect(options.connectionSet.length).toBeGreaterThan(0)
  })
})
