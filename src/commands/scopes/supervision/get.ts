import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ScopesSupervisionGet extends BaseCommand<typeof ScopesSupervisionGet> {
  static description = "Get a scope's supervision config (which scopes it supervises as subordinates)."

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    view: Flags.string({ description: 'Which variation to read.', options: ['active', 'draft'] }),
  }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const supervision = await mgmt.scopes
      .supervision(this.args.id)
      .get({ view: this.flags.view as 'active' | 'draft' | undefined })
    this.print(supervision, () => JSON.stringify(supervision, null, 2))
  }
}
