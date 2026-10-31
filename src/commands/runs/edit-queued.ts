import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { activeRunSessionId } from '../../run-session.js'

export default class RunsEditQueued extends BaseCommand<typeof RunsEditQueued> {
  static description =
    'Replace the message of a run that is still queued (not yet started). Replace PLACEHOLDER_RUN_ID with a queued run id from `runs list-active`.'

  static examples = [
    '<%= config.bin %> runs edit-queued PLACEHOLDER_RUN_ID --message "Summarize last week instead."',
    '<%= config.bin %> runs edit-queued PLACEHOLDER_RUN_ID --message "Summarize last week instead." --session PLACEHOLDER_SESSION_ID --pretty',
  ]

  static args = {
    runId: Args.string({ description: 'Run id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    message: Flags.string({ description: 'Message that replaces the queued turn.', required: true }),
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
    const edited = await client.workflows.runs.editQueued(runId, { message: this.flags.message, sessionId })
    this.print(edited, () => `Edited queued run ${edited.runId} (${edited.status}).`)
  }
}
