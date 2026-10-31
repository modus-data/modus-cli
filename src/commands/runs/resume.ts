import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class RunsResume extends BaseCommand<typeof RunsResume> {
  static description =
    'Resume a run awaiting human input (approval gate) with a decision. Replace PLACEHOLDER_RUN_ID and PLACEHOLDER_SESSION_ID with values from the run or `runs list-active`.'

  static examples = [
    '<%= config.bin %> runs resume PLACEHOLDER_RUN_ID --session PLACEHOLDER_SESSION_ID --decision approve',
    '<%= config.bin %> runs resume PLACEHOLDER_RUN_ID --session PLACEHOLDER_SESSION_ID --decision deny --json',
  ]

  static args = {
    runId: Args.string({ description: 'Run id.', required: true }),
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
      sessionId: this.flags.session,
      decision: this.flags.decision as 'approve' | 'deny' | 'connected' | 'cancelled',
    })
    await this.printRunEvents(stream, this.flags.json)
  }
}
