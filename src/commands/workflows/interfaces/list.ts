import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { renderTable } from '../../../output.js'

export default class WorkflowsInterfacesList extends BaseCommand<typeof WorkflowsInterfacesList> {
  static description = "List a workflow's interfaces (slack, mcp, teams)."

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const interfaces = await mgmt.workflows.interfaces(this.args.id).list()
    this.print(interfaces, () =>
      renderTable(interfaces as unknown as Array<Record<string, unknown>>, ['id', 'type', 'name', 'updatedAt']),
    )
  }
}
