import { mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthenticationError } from '@getmodus/sdk'
import { BaseCommand } from '../../src/base-command.js'
import { readStoredConfig, writeStoredConfig } from '../../src/config.js'

// Fixed (not per-test) so the mock can be hoisted above the static imports above —
// config.ts computes its config dir from homedir() on every call (not a module-load-time
// constant), so a single hoisted vi.mock is enough; no vi.resetModules()/dynamic
// re-import dance needed to get BaseCommand to see it.
const FAKE_HOME = join(tmpdir(), 'modus-cli-resolve-auth-test-home')

vi.mock('node:os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:os')>()
  return { ...actual, homedir: () => FAKE_HOME }
})

interface ResolvedAuth {
  resolveAuth(): Promise<{ apiKey: string; baseUrl?: string }>
}

// resolveAuth() doesn't touch any of oclif's Command constructor machinery (parsed
// flags/args) — a bare prototype instance (skipping the constructor) is enough.
function makeCommand(): ResolvedAuth {
  return Object.create(BaseCommand.prototype) as ResolvedAuth
}

describe('BaseCommand.resolveAuth', () => {
  beforeEach(async () => {
    await mkdir(FAKE_HOME, { recursive: true })
    delete process.env.MODUS_API_KEY
    delete process.env.MODUS_BASE_URL
  })

  afterEach(async () => {
    delete process.env.MODUS_API_KEY
    delete process.env.MODUS_BASE_URL
    vi.unstubAllGlobals()
    await rm(FAKE_HOME, { recursive: true, force: true })
  })

  it('throws AuthenticationError when nothing is configured', async () => {
    const command = makeCommand()
    await expect(command.resolveAuth()).rejects.toThrow(AuthenticationError)
  })

  it('MODUS_API_KEY env var wins even over a stored OAuth session', async () => {
    await writeStoredConfig({
      apiKey: 'modus_oat_stored',
      oauth: { issuer: 'https://app.getmodus.com', clientId: 'dyn_x', refreshToken: 'r', accessTokenExpiresAt: 0 },
    })
    process.env.MODUS_API_KEY = 'modus_pat_env'
    const command = makeCommand()
    await expect(command.resolveAuth()).resolves.toEqual({ apiKey: 'modus_pat_env', baseUrl: undefined })
  })

  it('returns the stored PAT unchanged when there is no oauth session', async () => {
    await writeStoredConfig({ apiKey: 'modus_pat_stored', baseUrl: 'https://api.staging.getmodus.com' })
    const command = makeCommand()
    await expect(command.resolveAuth()).resolves.toEqual({
      apiKey: 'modus_pat_stored',
      baseUrl: 'https://api.staging.getmodus.com',
    })
  })

  it('reuses the stored OAuth access token when it is not near expiry', async () => {
    await writeStoredConfig({
      apiKey: 'modus_oat_fresh',
      oauth: {
        issuer: 'https://app.getmodus.com',
        clientId: 'dyn_x',
        refreshToken: 'r',
        accessTokenExpiresAt: Date.now() + 60 * 60 * 1000,
      },
    })
    vi.stubGlobal('fetch', vi.fn())
    const command = makeCommand()
    await expect(command.resolveAuth()).resolves.toEqual({ apiKey: 'modus_oat_fresh', baseUrl: undefined })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('transparently refreshes and persists a near-expiry OAuth access token', async () => {
    await writeStoredConfig({
      apiKey: 'modus_oat_old',
      oauth: {
        issuer: 'https://app.getmodus.com',
        clientId: 'dyn_x',
        refreshToken: 'modus_ort_old',
        accessTokenExpiresAt: Date.now() + 1000, // inside the refresh skew window
      },
    })
    const metadata = {
      issuer: 'https://app.getmodus.com',
      authorization_endpoint: 'https://app.getmodus.com/oauth/authorize',
      token_endpoint: 'https://app.getmodus.com/oauth/token',
      registration_endpoint: 'https://app.getmodus.com/oauth/register',
      revocation_endpoint: 'https://app.getmodus.com/oauth/revoke',
      scopes_supported: ['workflows:read'],
    }
    const tokenResponse = {
      access_token: 'modus_oat_new',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'modus_ort_new',
      scope: 'workflows:read',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        String(url).includes('well-known')
          ? ({ ok: true, json: async () => metadata } as Response)
          : ({ ok: true, json: async () => tokenResponse } as Response),
      ),
    )

    const command = makeCommand()
    const result = await command.resolveAuth()
    expect(result).toEqual({ apiKey: 'modus_oat_new', baseUrl: undefined })

    const persisted = await readStoredConfig()
    expect(persisted.apiKey).toBe('modus_oat_new')
    expect(persisted.oauth?.refreshToken).toBe('modus_ort_new')
    expect(persisted.oauth?.accessTokenExpiresAt).toBeGreaterThan(Date.now())
  })
})
