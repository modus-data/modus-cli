import { Args } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class WorkflowsRestore extends BaseCommand<typeof WorkflowsRestore> {
  static description = 'Restore a previously deleted workflow.'

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const workflow = await mgmt.workflows.restore(this.args.id)
    this.print(workflow, () => JSON.stringify(workflow, null, 2))
  }
}
