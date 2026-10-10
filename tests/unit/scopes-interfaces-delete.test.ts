import { describe, expect, it } from 'vitest'
import { deleteConfirmation } from '../../src/commands/scopes/interfaces/delete.js'

describe('scopes interfaces delete confirmation', () => {
  it('proceeds without asking when --yes is passed', () => {
    expect(deleteConfirmation({ yes: true, interactive: false })).toBe('proceed')
    expect(deleteConfirmation({ yes: true, interactive: true })).toBe('proceed')
  })

  it('asks on an interactive terminal', () => {
    expect(deleteConfirmation({ yes: false, interactive: true })).toBe('prompt')
  })

  it('refuses non-interactive input without --yes', () => {
    expect(deleteConfirmation({ yes: false, interactive: false })).toBe('refuse')
  })
})
