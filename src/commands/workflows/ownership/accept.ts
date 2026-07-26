import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class WorkflowsOwnershipAccept extends BaseCommand<typeof WorkflowsOwnershipAccept> {
  static description = 'Accept a pending ownership transfer for a workflow (run as the incoming owner).'

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const workflow = await mgmt.workflows.acceptOwnershipTransfer(this.args.id)
    this.print(workflow, () => JSON.stringify(workflow, null, 2))
  }
}
