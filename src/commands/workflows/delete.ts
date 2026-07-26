import { Args } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class WorkflowsDelete extends BaseCommand<typeof WorkflowsDelete> {
  static description = 'Delete a workflow.'

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    await mgmt.workflows.delete(this.args.id)
    this.print({ deleted: true, id: this.args.id }, () => `Deleted workflow ${this.args.id}.`)
  }
}
