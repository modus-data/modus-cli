import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class WorkflowsToggle extends BaseCommand<typeof WorkflowsToggle> {
  static description = 'Activate or deactivate a workflow trigger.'

  static examples = ['<%= config.bin %> workflows toggle 42 --active', '<%= config.bin %> workflows toggle 42 --no-active']

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    active: Flags.boolean({ description: 'Whether the workflow trigger should be active.', required: true, allowNo: true }),
  }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const workflow = await mgmt.workflows.toggle(this.args.id, { active: this.flags.active })
    this.print(workflow, () => JSON.stringify(workflow, null, 2))
  }
}
