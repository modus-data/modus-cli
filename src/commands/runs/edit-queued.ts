import { Args } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class RunsEditQueued extends BaseCommand<typeof RunsEditQueued> {
  static description = 'Flush a queued edit for a run awaiting one.'

  static args = {
    runId: Args.string({ description: 'Run id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const client = await this.modusClient()
    await client.workflows.runs.editQueued(this.args.runId)
    this.print({ edited: true, runId: this.args.runId }, () => `Edited queued run ${this.args.runId}.`)
  }
}
