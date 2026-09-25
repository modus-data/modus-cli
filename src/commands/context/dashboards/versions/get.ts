import { Args } from '@oclif/core'
import { BaseCommand } from '../../../../base-command.js'
import { renderDashboard } from '../../../../dashboard-output.js'

export default class ContextDashboardsVersionsGet extends BaseCommand<typeof ContextDashboardsVersionsGet> {
  static description =
    'Get a dashboard as it was in one version. Replace PLACEHOLDER_VERSION_ID with an id from `context dashboards versions list`.'

  static examples = [
    '<%= config.bin %> context dashboards versions get PLACEHOLDER_DASHBOARD_ID PLACEHOLDER_VERSION_ID',
    '<%= config.bin %> context dashboards versions get PLACEHOLDER_DASHBOARD_ID PLACEHOLDER_VERSION_ID --pretty',
  ]

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
    versionId: Args.string({ description: 'Version id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const dashboard = await mgmt.context.dashboards.getVersion(this.args.dashboardId, this.args.versionId)
    this.print(dashboard, () => renderDashboard(dashboard))
  }
}
