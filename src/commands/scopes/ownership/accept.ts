import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ScopesOwnershipAccept extends BaseCommand<typeof ScopesOwnershipAccept> {
  static description = 'Accept a pending ownership transfer for a scope (run as the incoming owner).'

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const scope = await mgmt.scopes.acceptOwnershipTransfer(this.args.id)
    this.print(scope, () => JSON.stringify(scope, null, 2))
  }
}
