import { Args } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class RunsInterrupt extends BaseCommand<typeof RunsInterrupt> {
  static description =
    'Interrupt an in-flight run (e.g. to redirect mid-execution). Replace PLACEHOLDER_RUN_ID with a run id from `runs list-active`.'

  static examples = ['<%= config.bin %> runs interrupt PLACEHOLDER_RUN_ID']

  static args = {
    runId: Args.string({ description: 'Run id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const client = await this.modusClient()
    await client.workflows.runs.interrupt(this.args.runId)
    this.print({ interrupted: true, runId: this.args.runId }, () => `Interrupted run ${this.args.runId}.`)
  }
}
