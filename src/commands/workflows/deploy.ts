import { Args } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class WorkflowsDeploy extends BaseCommand<typeof WorkflowsDeploy> {
  static description = 'Deploy a workflow (publish the current draft as the active variation).'

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const workflow = await mgmt.workflows.deploy(this.args.id)
    this.print(workflow, () => JSON.stringify(workflow, null, 2))
  }
}
