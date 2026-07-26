import { Args } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class RunsEvents extends BaseCommand<typeof RunsEvents> {
  static description = "Get a run's recorded event history."

  static args = {
    runId: Args.string({ description: 'Run id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const events = await client.workflows.runs.events(this.args.runId)
    this.print(events, () => JSON.stringify(events, null, 2))
  }
}
