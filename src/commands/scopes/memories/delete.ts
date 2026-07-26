import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ScopesMemoriesDelete extends BaseCommand<typeof ScopesMemoriesDelete> {
  static description = 'Delete a memory.'

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
    memoryId: Args.string({ description: 'Memory id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    await mgmt.scopes.memories(this.args.id).delete(this.args.memoryId)
    this.print({ deleted: true, memoryId: this.args.memoryId }, () => `Deleted memory ${this.args.memoryId}.`)
  }
}
