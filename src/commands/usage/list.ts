import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class UsageList extends BaseCommand<typeof UsageList> {
  static description = 'Report token/run usage over a time window, rolled up by hour or day.'

  static examples = [
    '<%= config.bin %> usage list --since 2026-07-01T00:00:00Z --until 2026-07-25T00:00:00Z --rollup day',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    since: Flags.string({ description: 'ISO-8601 start of the window.', required: true }),
    until: Flags.string({ description: 'ISO-8601 end of the window.', required: true }),
    rollup: Flags.string({ description: 'Bucket size.', options: ['hour', 'day'], default: 'day' }),
    model: Flags.string({ description: 'Filter by model identifier.' }),
    'user-email': Flags.string({ description: 'Filter by acting-user email (repeatable).', multiple: true }),
  }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const report = await mgmt.usage.list({
      since: this.flags.since,
      until: this.flags.until,
      rollup: this.flags.rollup as 'hour' | 'day',
      model: this.flags.model,
      userEmail: this.flags['user-email'],
    })
    this.print(report, () => JSON.stringify(report, null, 2))
  }
}
