import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class RunsStream extends BaseCommand<typeof RunsStream> {
  static description = "Tail an existing run's live event stream."

  static args = {
    runId: Args.string({ description: 'Run id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'last-event-id': Flags.string({ description: 'Resume streaming after this SSE event id.' }),
    json: Flags.boolean({ description: 'Emit structured SSE-derived events instead of raw streamed text.' }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const stream = client.workflows.runs.stream(this.args.runId, {
      lastEventId: this.flags['last-event-id'],
    })
    if (this.flags.json) {
      for await (const event of stream) this.log(JSON.stringify(event))
      return
    }
    for await (const event of stream) {
      if (event.type === 'token') process.stdout.write(event.content)
    }
    process.stdout.write('\n')
  }
}
