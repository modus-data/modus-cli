import { Args } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class ScopesRestore extends BaseCommand<typeof ScopesRestore> {
  static description = 'Restore a previously deleted scope.'

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const scope = await mgmt.scopes.restore(this.args.id)
    this.print(scope, () => JSON.stringify(scope, null, 2))
  }
}
