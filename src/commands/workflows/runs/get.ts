import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class WorkflowsRunsGet extends BaseCommand<typeof WorkflowsRunsGet> {
  static description = 'Get a single workflow run.'

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
    runId: Args.string({ description: 'Run id.', required: true }),
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
