import { Args, Flags } from '@oclif/core'
import type { DashboardView } from '@getmodus/sdk/management'
import { BaseCommand } from '../../../base-command.js'
import { renderDashboard } from '../../../dashboard-output.js'

export default class ContextDashboardsGet extends BaseCommand<typeof ContextDashboardsGet> {
  static description =
    'Get one dashboard with its full definition and draft revision. Replace PLACEHOLDER_DASHBOARD_ID with an id from `context dashboards list`.'

  static examples = [
    '<%= config.bin %> context dashboards get PLACEHOLDER_DASHBOARD_ID',
    '<%= config.bin %> context dashboards get PLACEHOLDER_DASHBOARD_ID --view draft --pretty',
  ]

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    view: Flags.string({
      description: 'active (default) returns the published version; draft returns the working draft.',
      options: ['active', 'draft'],
    }),
  }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const dashboard = await mgmt.context.dashboards.get(this.args.dashboardId, {
      view: this.flags.view as DashboardView | undefined,
    })
    this.print(dashboard, () => renderDashboard(dashboard))
  }
}
