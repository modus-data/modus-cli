import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Config } from '@oclif/core'
import { ModusManagement } from '@getmodus/sdk/management'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readExampleFixture } from '../../src/examples.js'
import ScopesCreate from '../../src/commands/scopes/create.js'
import ScopesUpdate from '../../src/commands/scopes/update.js'

const CLI_ROOT = path.resolve(import.meta.dirname, '../..')
const CONNECTION = '11111111-1111-4111-8111-111111111111'
const OTHER_CONNECTION = '22222222-2222-4222-8222-222222222222'

const toolset = {
  slack: {
    byConnection: {
      [CONNECTION]: { actions: ['SendMessage'], rules: { allowedChannelIds: ['C123'], allowedChannelNames: { C123: 'support' } } },
      [OTHER_CONNECTION]: { actions: ['GetMessages'] },
    },
  },
  postgresql: { byConnection: { [CONNECTION]: { actions: ['query'] } } },
  memory: { enabled: true },
  Coding: [{ connectionUid: CONNECTION, repoOwner: 'example', repoName: 'app', branch: 'main' }],
  custom_mcps: ['example'],
  pipedream: ['example'],
}

describe('scope toolsets', () => {
  const dirs: string[] = []
  afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
  })

  it('ships a per-connection SQL query grant in scopes create --example', async () => {
    const example = JSON.parse(await readExampleFixture('scope-full.json'))
    expect(example.toolset).toEqual({
      memory: { enabled: true },
      postgresql: { byConnection: { PLACEHOLDER_CONNECTION_ID: { actions: ['query'] } } },
    })
  })

  it.each(['create', 'update'] as const)('%s forwards canonical toolsets unchanged through the SDK', async (operation) => {
    const dir = await mkdtemp(path.join(tmpdir(), 'scopes-toolset-'))
    dirs.push(dir)
    const file = path.join(dir, 'scope.json')
    await writeFile(file, JSON.stringify({ name: 'Tools', toolset }))
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 42 }), { status: 200 }))
    const mgmt = new ModusManagement({ apiKey: 'modus_test_key', maxRetries: 0, fetch })
    class CreateHarness extends ScopesCreate {
      protected override async modusManagement() { return mgmt }
    }
    class UpdateHarness extends ScopesUpdate {
      protected override async modusManagement() { return mgmt }
    }
    const config = await Config.load(CLI_ROOT)
    if (operation === 'create') await CreateHarness.run(['--file', file], config)
    else await UpdateHarness.run(['42', '--file', file], config)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0]?.[1]?.method).toBe(operation === 'create' ? 'POST' : 'PATCH')
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body)).toolset).toEqual(toolset)
  })

  it('leaves known-value validation to the API and surfaces its 422 without conversion or retry', async () => {
    const input = { sql_runner: [`SELECT:${CONNECTION}:`] }
    const dir = await mkdtemp(path.join(tmpdir(), 'scopes-toolset-'))
    dirs.push(dir)
    const file = path.join(dir, 'scope.json')
    await writeFile(file, JSON.stringify({ toolset: input }))
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'VALIDATION', message: 'sql_runner: use a platform byConnection grant' },
    }), { status: 422 }))
    const mgmt = new ModusManagement({ apiKey: 'modus_test_key', fetch })
    class Harness extends ScopesUpdate {
      protected override async modusManagement() { return mgmt }
    }
    await expect(Harness.run(['42', '--file', file], await Config.load(CLI_ROOT)))
      .rejects.toThrow('sql_runner: use a platform byConnection grant')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body)).toolset).toEqual(input)
  })
})
