import { Args, Flags } from '@oclif/core'
import type { MemoryUpdate } from '@getmodus/sdk/management'
import { BaseCommand } from '../../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../../input.js'

export default class ScopesMemoriesUpdate extends BaseCommand<typeof ScopesMemoriesUpdate> {
  static description = 'Update a memory (replacement text and/or metadata).'

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
    memoryId: Args.string({ description: 'Memory id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file with update fields.' }),
    body: Flags.string({ description: "Read update fields as JSON from stdin ('-')." }),
    memory: Flags.string({ description: 'Replacement memory text.' }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, { memory: this.flags.memory })

    const mgmt = await this.modusManagement()
    const memory = await mgmt.scopes.memories(this.args.id).update(
      this.args.memoryId,
      body as unknown as MemoryUpdate,
    )
    this.print(memory, () => JSON.stringify(memory, null, 2))
  }
}
