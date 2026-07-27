import { describe, expect, it } from 'vitest'
import { MODUS_LOGO } from '../../src/logo.js'

describe('MODUS_LOGO', () => {
  it('renders a 5-line banner with no stray escape artifacts', () => {
    // eslint-disable-next-line no-control-regex
    const plain = MODUS_LOGO.replace(/\x1B\[[0-9;]*m/g, '')
    const lines = plain.split('\n')
    expect(lines).toHaveLength(5)
    for (const line of lines) {
      expect(line).not.toMatch(/undefined|NaN/)
    }
  })
})
