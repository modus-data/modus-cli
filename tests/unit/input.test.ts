import { describe, expect, it } from 'vitest'
import { mergeJsonBody } from '../../src/input.js'

describe('mergeJsonBody', () => {
  it('lets explicit overrides win over matching file keys', () => {
    const merged = mergeJsonBody({ name: 'from-file', model: 'from-file-model' }, { name: 'from-flag' })
    expect(merged).toEqual({ name: 'from-flag', model: 'from-file-model' })
  })

  it('ignores undefined overrides', () => {
    const merged = mergeJsonBody({ name: 'from-file' }, { name: undefined, description: undefined })
    expect(merged).toEqual({ name: 'from-file' })
  })

  it('adds new keys from overrides not present in the file body', () => {
    const merged = mergeJsonBody({}, { name: 'from-flag' })
    expect(merged).toEqual({ name: 'from-flag' })
  })
})
