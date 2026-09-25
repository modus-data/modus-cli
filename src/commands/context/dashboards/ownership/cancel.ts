import { Args } from '@oclif/core'
import { BaseCommand } from '../../../../base-command.js'

export default class ContextDashboardsOwnershipCancel extends BaseCommand<typeof ContextDashboardsOwnershipCancel> {
  static description = 'Cancel a pending ownership transfer for a dashboard (run as the owner).'

  static examples = ['<%= config.bin %> context dashboards ownership cancel PLACEHOLDER_DASHBOARD_ID']

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const dashboard = await mgmt.context.dashboards.cancelOwnershipTransfer(this.args.dashboardId)
    this.print(dashboard, () => JSON.stringify(dashboard, null, 2))
  }
}
