import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class WorkflowsOwnershipCancel extends BaseCommand<typeof WorkflowsOwnershipCancel> {
  static description = 'Cancel a pending ownership transfer request for a workflow.'

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const workflow = await mgmt.workflows.cancelOwnershipTransfer(this.args.id)
    this.print(workflow, () => JSON.stringify(workflow, null, 2))
  }
}
