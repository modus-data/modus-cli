import { Args } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { renderTable } from '../../output.js'

export default class WorkflowsGet extends BaseCommand<typeof WorkflowsGet> {
  static description = 'Get a workflow by id.'

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const workflow = await client.workflows.get(this.args.id)
    this.print(workflow, () =>
      renderTable(
        [workflow as unknown as Record<string, unknown>],
        ['id', 'slug', 'name', 'type', 'status', 'description'],
      ),
    )
  }
}
