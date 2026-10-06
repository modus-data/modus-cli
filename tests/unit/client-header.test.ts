import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Modus } from '@getmodus/sdk'
import type { ModusManagement } from '@getmodus/sdk/management'
import { BaseCommand } from '../../src/base-command.js'
import Login from '../../src/commands/login.js'

vi.mock('../../src/config.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/config.js')>()),
  writeStoredConfig: vi.fn(),
}))

interface Clients {
  modusClient(): Promise<Modus>
  modusManagement(): Promise<ModusManagement>
}

function stubFetch(body: unknown) {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

describe('CLI requests identify the CLI', () => {
  afterEach(() => {
    delete process.env.MODUS_API_KEY
    vi.unstubAllGlobals()
  })

  it.each(['modusClient', 'modusManagement'] as const)('%s', async (factory) => {
    process.env.MODUS_API_KEY = 'modus_pat_env'
    const fetch = stubFetch({})
    const command = Object.create(BaseCommand.prototype) as Clients

    await (await command[factory]()).http.get('/api/v1/scopes')

    expect(fetch.mock.calls[0]?.[1]?.headers).toMatchObject({ 'X-Modus-Client': 'cli' })
  })

  it('login --token', async () => {
    const fetch = stubFetch({ scopes: [], nextPageToken: null })
    const command = Object.create(Login.prototype) as Login
    Object.assign(command, { flags: { token: 'modus_pat_x' }, warn: vi.fn(), log: vi.fn() })

    await command.run()

    expect(fetch.mock.calls[0]?.[1]?.headers).toMatchObject({ 'X-Modus-Client': 'cli' })
  })
})
