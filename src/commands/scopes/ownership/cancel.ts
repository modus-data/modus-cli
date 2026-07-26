import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ScopesOwnershipCancel extends BaseCommand<typeof ScopesOwnershipCancel> {
  static description = 'Cancel a pending ownership transfer request for a scope.'

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const scope = await mgmt.scopes.cancelOwnershipTransfer(this.args.id)
    this.print(scope, () => JSON.stringify(scope, null, 2))
  }
}
