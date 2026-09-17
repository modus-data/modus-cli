import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ContextDashboardsPublish extends BaseCommand<typeof ContextDashboardsPublish> {
  static description =
    'Publish the draft as a new version that everyone with access sees. Alert workflows defined on the dashboard are updated to match.'

  static examples = [
    '<%= config.bin %> context dashboards publish PLACEHOLDER_DASHBOARD_ID --expected-revision 4',
  ]

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'expected-revision': Flags.integer({
      description: 'Draft revision you reviewed and want to publish.',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const result = await mgmt.context.dashboards.publish(this.args.dashboardId, {
      expectedRevision: this.flags['expected-revision'],
    })
    this.print(result, () => JSON.stringify(result, null, 2))
  }
}
