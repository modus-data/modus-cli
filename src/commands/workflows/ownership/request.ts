import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class WorkflowsOwnershipRequest extends BaseCommand<typeof WorkflowsOwnershipRequest> {
  static description = 'Request an ownership transfer for a workflow to another user.'

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'new-owner-user-id': Flags.string({ description: 'User id of the new owner.', required: true }),
  }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const workflow = await mgmt.workflows.requestOwnershipTransfer(this.args.id, {
      newOwnerUserId: this.flags['new-owner-user-id'],
    })
    this.print(workflow, () => JSON.stringify(workflow, null, 2))
  }
}
