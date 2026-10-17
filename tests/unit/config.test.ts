import { chmod, mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { maskToken, parseOrgUuidFromToken, tokenKindFromToken } from '../../src/config.js'

const UUID = '00000000-0000-0000-0000-000000000004'

describe('parseOrgUuidFromToken', () => {
  it('extracts the org uuid embedded in a PAT (modus_pat_<uuid>_<prefix>_<secret>)', () => {
    const token = 'modus_pat_00000000-0000-0000-0000-000000000001_abcd1234abcd1234_secretvalue'
    expect(parseOrgUuidFromToken(token)).toBe('00000000-0000-0000-0000-000000000001')
  })

  it('extracts the org uuid from an OAuth access/refresh token too', () => {
    expect(
      parseOrgUuidFromToken('modus_oat_00000000-0000-0000-0000-000000000002_abcd1234abcd1234_secretvalue'),
    ).toBe('00000000-0000-0000-0000-000000000002')
    expect(
      parseOrgUuidFromToken('modus_ort_00000000-0000-0000-0000-000000000003_abcd1234abcd1234_secretvalue'),
    ).toBe('00000000-0000-0000-0000-000000000003')
  })

  it('parses the org uuid from a service token', () => {
    expect(parseOrgUuidFromToken(`modus_sat_${UUID}_0123456789abcdef_secret`)).toBe(UUID)
  })

  it('returns undefined for a malformed token', () => {
    expect(parseOrgUuidFromToken('not-a-token')).toBeUndefined()
    expect(parseOrgUuidFromToken('modus_pat_notauuid_abcd_secret')).toBeUndefined()
  })
})

describe('tokenKindFromToken', () => {
  it('names the token kind', () => {
    expect(tokenKindFromToken(`modus_sat_${UUID}_x_y`)).toBe('service')
    expect(tokenKindFromToken(`modus_pat_${UUID}_x_y`)).toBe('personal')
    expect(tokenKindFromToken(`modus_oat_${UUID}_x_y`)).toBe('oauth')
    expect(tokenKindFromToken(`modus_ort_${UUID}_x_y`)).toBe('oauth')
    expect(tokenKindFromToken('nope')).toBeUndefined()
  })
})

describe('maskToken', () => {
  it('keeps a short prefix and masks the rest', () => {
    const token = 'modus_pat_00000000-0000-0000-0000-000000000001_abcd1234abcd1234_secretvalue'
    const masked = maskToken(token)
    expect(masked.startsWith(token.slice(0, 14))).toBe(true)
    expect(masked.endsWith('***')).toBe(true)
    expect(masked).not.toContain('secretvalue')
  })

  it('fully masks very short strings', () => {
    expect(maskToken('short')).toBe('***')
  })
})

describe('config file permission tightening', () => {
  let homeDir: string

  beforeEach(async () => {
    homeDir = await mkdtemp(join(tmpdir(), 'modus-cli-home-'))
    vi.resetModules()
    vi.doMock('node:os', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:os')>()
      return { ...actual, homedir: () => homeDir }
    })
  })

  afterEach(async () => {
    vi.doUnmock('node:os')
    await rm(homeDir, { recursive: true, force: true })
  })

  it('writes the dir/file with restrictive permissions', async () => {
    const { writeStoredConfig, configFilePath } = await import('../../src/config.js')
    await writeStoredConfig({ apiKey: 'modus_test' })

    const fileStat = await stat(configFilePath())
    expect(fileStat.mode & 0o777).toBe(0o600)
  })

  it('re-tightens a pre-existing, loosely-permissioned config on read (not just on login)', async () => {
    const configDir = join(homeDir, '.config', 'modus')
    const configFile = join(configDir, 'config.json')
    await mkdir(configDir, { recursive: true })
    await chmod(configDir, 0o755)
    await writeFile(configFile, JSON.stringify({ apiKey: 'modus_test' }))
    await chmod(configFile, 0o644)

    const { readStoredConfig } = await import('../../src/config.js')
    const loaded = await readStoredConfig()
    expect(loaded).toEqual({ apiKey: 'modus_test' })

    expect((await stat(configDir)).mode & 0o777).toBe(0o700)
    expect((await stat(configFile)).mode & 0o777).toBe(0o600)
  })
})
