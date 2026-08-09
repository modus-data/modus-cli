import { describe, expect, it } from 'vitest'
import { ValidationError } from '@getmodus/sdk'
import { checkPageSize, parseIdList } from '../../src/validation.js'

describe('checkPageSize', () => {
  it('allows undefined (flag omitted)', () => {
    expect(() => checkPageSize(undefined, 100)).not.toThrow()
  })

  it('allows values within [1, max]', () => {
    expect(() => checkPageSize(1, 100)).not.toThrow()
    expect(() => checkPageSize(100, 100)).not.toThrow()
    expect(() => checkPageSize(50, 100)).not.toThrow()
  })

  it('rejects a value above max', () => {
    expect(() => checkPageSize(101, 100)).toThrow(ValidationError)
    expect(() => checkPageSize(500, 200)).toThrow(/between 1 and 200/)
  })

  it('rejects a value below 1', () => {
    expect(() => checkPageSize(0, 100)).toThrow(ValidationError)
    expect(() => checkPageSize(-5, 100)).toThrow(ValidationError)
  })

  it('rejects a non-integer', () => {
    expect(() => checkPageSize(1.5, 100)).toThrow(ValidationError)
  })
})

describe('parseIdList', () => {
  it('parses a valid CSV list of integers', () => {
    expect(parseIdList('1,2,3', 'scope-ids')).toEqual([1, 2, 3])
  })

  it('trims whitespace around values', () => {
    expect(parseIdList(' 1 , 2 , 3 ', 'scope-ids')).toEqual([1, 2, 3])
  })

  it('rejects a hex value instead of silently coercing it', () => {
    expect(() => parseIdList('0x10', 'scope-ids')).toThrow(ValidationError)
    expect(() => parseIdList('0x10', 'scope-ids')).toThrow(/scope-ids/)
  })

  it('rejects an exponential value instead of silently coercing it', () => {
    expect(() => parseIdList('1e2', 'scope-ids')).toThrow(ValidationError)
  })

  it('rejects a decimal value', () => {
    expect(() => parseIdList('1.5', 'scope-ids')).toThrow(ValidationError)
  })

  it('rejects a negative value', () => {
    expect(() => parseIdList('-1', 'scope-ids')).toThrow(ValidationError)
  })

  it('rejects zero (ids must be positive)', () => {
    expect(() => parseIdList('0', 'scope-ids')).toThrow(ValidationError)
  })

  it('rejects a whitespace-only value', () => {
    expect(() => parseIdList('1,   ,3', 'scope-ids')).toThrow(ValidationError)
  })

  it('includes the flag name and offending value in the error message', () => {
    expect(() => parseIdList('1,abc', 'scope-ids')).toThrow(/--scope-ids.*"abc"/)
  })
})
