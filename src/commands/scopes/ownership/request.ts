import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ScopesOwnershipRequest extends BaseCommand<typeof ScopesOwnershipRequest> {
  static description = 'Request an ownership transfer for a scope to another user.'

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'new-owner-user-id': Flags.string({ description: 'User id of the new owner.', required: true }),
  }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const scope = await mgmt.scopes.requestOwnershipTransfer(this.args.id, {
      newOwnerUserId: this.flags['new-owner-user-id'],
    })
    this.print(scope, () => JSON.stringify(scope, null, 2))
  }
}
