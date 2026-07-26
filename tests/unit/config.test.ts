import { describe, expect, it } from 'vitest'
import { maskToken, parseOrgUuidFromToken } from '../../src/config.js'

describe('parseOrgUuidFromToken', () => {
  it('extracts the org uuid embedded in a PAT', () => {
    const token = 'modus_00000000-0000-0000-0000-000000000001_abcd_secretvalue'
    expect(parseOrgUuidFromToken(token)).toBe('00000000-0000-0000-0000-000000000001')
  })

  it('returns undefined for a malformed token', () => {
    expect(parseOrgUuidFromToken('not-a-token')).toBeUndefined()
    expect(parseOrgUuidFromToken('modus_notauuid_abcd_secret')).toBeUndefined()
  })
})

describe('maskToken', () => {
  it('keeps a short prefix and masks the rest', () => {
    const token = 'modus_00000000-0000-0000-0000-000000000001_abcd_secretvalue'
    const masked = maskToken(token)
    expect(masked.startsWith(token.slice(0, 14))).toBe(true)
    expect(masked.endsWith('***')).toBe(true)
    expect(masked).not.toContain('secretvalue')
  })

  it('fully masks very short strings', () => {
    expect(maskToken('short')).toBe('***')
  })
})
