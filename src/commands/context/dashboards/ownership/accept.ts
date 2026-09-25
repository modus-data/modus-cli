import { Args } from '@oclif/core'
import { BaseCommand } from '../../../../base-command.js'

export default class ContextDashboardsOwnershipAccept extends BaseCommand<typeof ContextDashboardsOwnershipAccept> {
  static description = 'Accept a pending ownership transfer for a dashboard (run as the incoming owner).'

  static examples = ['<%= config.bin %> context dashboards ownership accept PLACEHOLDER_DASHBOARD_ID']

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const dashboard = await mgmt.context.dashboards.acceptOwnershipTransfer(this.args.dashboardId)
    this.print(dashboard, () => JSON.stringify(dashboard, null, 2))
  }
}
