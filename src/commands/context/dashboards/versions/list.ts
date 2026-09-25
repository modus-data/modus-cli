import { Args } from '@oclif/core'
import { BaseCommand } from '../../../../base-command.js'
import { renderVersionsList } from '../../../../dashboard-output.js'

export default class ContextDashboardsVersionsList extends BaseCommand<typeof ContextDashboardsVersionsList> {
  static description = 'List the published versions of a dashboard, newest first, with their full definitions.'

  static examples = [
    '<%= config.bin %> context dashboards versions list PLACEHOLDER_DASHBOARD_ID',
    '<%= config.bin %> context dashboards versions list PLACEHOLDER_DASHBOARD_ID --pretty',
  ]

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const versions = await mgmt.context.dashboards.listVersions(this.args.dashboardId)
    this.print(versions, () => renderVersionsList(versions))
  }
}
