import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class WorkflowsInterfacesDeleteAll extends BaseCommand<typeof WorkflowsInterfacesDeleteAll> {
  static description = "Remove every interface from a workflow (use `interfaces delete` for a single one)."

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    await mgmt.workflows.interfaces(this.args.id).deleteAll()
    this.print({ deletedAll: true, workflowId: this.args.id }, () => `Deleted all interfaces for workflow ${this.args.id}.`)
  }
}
