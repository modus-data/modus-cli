import { describe, expect, it } from 'vitest'
import { ValidationError } from '@getmodus/sdk'
import { checkPageSize } from '../../src/validation.js'

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
