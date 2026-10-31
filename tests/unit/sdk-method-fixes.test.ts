import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Config } from '@oclif/core'
import { describe, expect, it, vi } from 'vitest'
import ScopesMemoriesUpdate from '../../src/commands/scopes/memories/update.js'
import WorkflowsCreate from '../../src/commands/workflows/create.js'
import WorkflowsUpdate from '../../src/commands/workflows/update.js'

const CLI_ROOT = path.join(fileURLToPath(new URL('../..', import.meta.url)))

describe('workflow commands', () => {
  // The workflow access DTO has no guardrails: every --guardrail call was a 400.
  it.each([
    ['create', WorkflowsCreate],
    ['update', WorkflowsUpdate],
  ])('%s has no --guardrail flag', (_name, command) => {
    expect(command.flags).not.toHaveProperty('guardrail')
  })
})

describe('scopes memories update', () => {
  it('prints a confirmation: the server answers 204 with no memory', async () => {
    const update = vi.fn().mockResolvedValue(undefined)
    const logged: string[] = []
    class Harness extends ScopesMemoriesUpdate {
      protected override async modusManagement() {
        return { scopes: { memories: () => ({ update }) } } as never
      }

      override log(message?: string): void {
        logged.push(String(message))
      }
    }
    await Harness.run(['42', 'mem_1', '--memory', 'New text'], await Config.load(CLI_ROOT))
    expect(update).toHaveBeenCalledWith('mem_1', { memory: 'New text' })
    expect(logged).toEqual([JSON.stringify({ updated: true, memoryId: 'mem_1' })])
  })
})
