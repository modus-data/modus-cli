import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class WorkflowsRunsGet extends BaseCommand<typeof WorkflowsRunsGet> {
  static description = 'Get a single workflow run.'

  static examples = [
    // Confirmed against real staging output: `runs list`'s `workflowId` field is what `runId`
    // wants here, NOT its `id` field (a composite of workflowId + temporalRunId) — using `id`
    // fails with "Automation run not found".
    '<%= config.bin %> workflows runs get 42 <workflowId from `runs list`> --temporal-run-id <temporalRunId from `runs list`>',
  ]

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
    runId: Args.string({
      description:
        "Run id — use the run's `workflowId` field from `workflows runs list`, not its `id` field.",
      required: true,
    }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'temporal-run-id': Flags.string({ description: 'Disambiguate retried runs by Temporal run id.' }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const run = await client.workflows.runs.get(this.args.id, this.args.runId, {
      temporalRunId: this.flags['temporal-run-id'],
    })
    this.print(run, () => JSON.stringify(run, null, 2))
  }
}
