import { describe, expect, it } from 'vitest'
import { selectionOpsRequest } from '../../src/commands/scopes/selection-ops/apply.js'

const ops = [{ op: 'setConnectionPreferences', connectionId: 'c1', preferences: { mode: 'all' } }]

describe('scopes selection-ops apply request', () => {
  it('forwards ops, toolset and a boolean validateOnly', () => {
    expect(selectionOpsRequest({ ops, toolset: { slack: {} }, validateOnly: true })).toEqual({
      ops,
      options: { toolset: { slack: {} }, validateOnly: true },
    })
    expect(selectionOpsRequest({ ops, validateOnly: false })).toEqual({ ops, options: { validateOnly: false } })
    expect(selectionOpsRequest({ ops })).toEqual({ ops, options: {} })
  })

  it.each(['true', null, 1])('refuses validateOnly %j instead of committing', (validateOnly) => {
    expect(selectionOpsRequest({ ops, validateOnly })).toBe('validateOnly must be true or false.')
  })

  it('requires ops to be an array', () => {
    expect(selectionOpsRequest({ ops: 'x' })).toBe('ops must be an array (include it via --file/--body).')
  })
})
