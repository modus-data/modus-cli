import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ContextDashboardsDelete extends BaseCommand<typeof ContextDashboardsDelete> {
  static description =
    'Delete a dashboard and the alert workflows defined on it. A deleted dashboard cannot be restored.'

  static examples = ['<%= config.bin %> context dashboards delete PLACEHOLDER_DASHBOARD_ID']

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    await mgmt.context.dashboards.delete(this.args.dashboardId)
    this.print(
      { deleted: true, id: this.args.dashboardId },
      () => `Deleted dashboard ${this.args.dashboardId}.`,
    )
  }
}
