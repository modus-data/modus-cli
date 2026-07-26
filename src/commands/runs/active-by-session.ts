import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { renderTable } from '../../output.js'

export default class RunsActiveBySession extends BaseCommand<typeof RunsActiveBySession> {
  static description = 'Look up active runs for specific session ids (e.g. --thread values from chat/run commands).'

  static examples = ['<%= config.bin %> runs active-by-session --session <sessionId> --session <sessionId2>']

  static flags = {
    ...BaseCommand.baseFlags,
    session: Flags.string({ description: 'Session id to check (repeatable, max 100).', multiple: true, required: true }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const runs = await client.workflows.runs.activeBySession(this.flags.session)
    this.print(runs, () => renderTable(runs as unknown as Array<Record<string, unknown>>, ['runId', 'sessionId', 'status', 'createdAt']))
  }
}
