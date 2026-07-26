import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class RunsResume extends BaseCommand<typeof RunsResume> {
  static description = 'Resume a run that is awaiting human input (e.g. an approval gate).'

  static examples = [
    '<%= config.bin %> runs resume <runId> --session <sessionId> --decision approve "Looks good, proceed."',
  ]

  static args = {
    runId: Args.string({ description: 'Run id.', required: true }),
    message: Args.string({ description: 'Message accompanying the decision (quote it).', required: false, ignoreStdin: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    session: Flags.string({ description: "The run's session id.", required: true }),
    decision: Flags.string({
      description: 'Decision that resumes the run.',
      options: ['approve', 'deny', 'connected', 'cancelled'],
      required: true,
    }),
    json: Flags.boolean({ description: 'Emit structured SSE-derived events instead of raw streamed text.' }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const stream = client.workflows.runs.resume(this.args.runId, {
      message: this.args.message ?? '',
      sessionId: this.flags.session,
      decision: this.flags.decision as 'approve' | 'deny' | 'connected' | 'cancelled',
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
