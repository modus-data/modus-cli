import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { renderTable } from '../../output.js'

export default class WorkflowsGet extends BaseCommand<typeof WorkflowsGet> {
  static description = 'Get a workflow by numeric id (full JSON, or a short table with --pretty).'

  static examples = [
    '<%= config.bin %> workflows get 42',
    '<%= config.bin %> workflows get 42 --pretty',
  ]

  static args = {
    id: Args.string({ description: 'Numeric workflow id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    view: Flags.string({
      description:
        'Which version to read. published is a published workflow of type workflow that you can use.',
      options: ['active', 'draft', 'published'],
    }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const workflow = await client.workflows.get(this.args.id, {
      view: this.flags.view as 'active' | 'draft' | 'published' | undefined,
    })
    this.print(workflow, () =>
      renderTable(
        [workflow as unknown as Record<string, unknown>],
        ['id', 'slug', 'name', 'type', 'status', 'description'],
      ),
    )
  }
}
