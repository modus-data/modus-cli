import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { renderTable } from '../../output.js'

export default class UsageListUsers extends BaseCommand<typeof UsageListUsers> {
  static description =
    "List distinct acting-user emails present in your organization's usage over a time window."

  static examples = [
    '<%= config.bin %> usage list-users --since 2026-07-01T00:00:00Z --until 2026-07-25T00:00:00Z',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    since: Flags.string({ description: 'ISO-8601 start of the window.', required: true }),
    until: Flags.string({ description: 'ISO-8601 end of the window.', required: true }),
  }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const report = await mgmt.usage.listUsers({ since: this.flags.since, until: this.flags.until })
    this.print(report, () => renderTable(report.users, ['email']))
  }
}
