import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { activeRunSessionId } from '../../run-session.js'

export default class RunsInterrupt extends BaseCommand<typeof RunsInterrupt> {
  static description =
    "Replace a run's current turn with a follow-up message and print the new run id (stream it with `runs stream`). On a finished run it starts a follow-up turn. Replace PLACEHOLDER_RUN_ID with a run id from `runs list-active`."

  static examples = [
    '<%= config.bin %> runs interrupt PLACEHOLDER_RUN_ID --message "Only count EMEA."',
    '<%= config.bin %> runs interrupt PLACEHOLDER_RUN_ID --message "Only count EMEA." --session PLACEHOLDER_SESSION_ID --pretty',
  ]

  static args = {
    runId: Args.string({ description: 'Run id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    message: Flags.string({ description: 'Follow-up message that replaces the current turn.', required: true }),
    session: Flags.string({
      description: "The run's session id. Defaults to the run's session from `runs list-active`.",
    }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const { runId } = this.args
    const sessionId = await activeRunSessionId(client, runId, this.flags.session)
    if (!sessionId) {
      this.error(`Run ${runId} is not in \`runs list-active\`; pass its --session.`, { exit: 3 })
    }
    const admitted = await client.workflows.runs.interrupt(runId, { message: this.flags.message, sessionId })
    this.print(admitted, () => `Interrupted run ${runId}. Follow-up run: ${admitted.runId} (${admitted.status}).`)
  }
}
