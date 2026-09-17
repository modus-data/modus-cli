import { Args } from '@oclif/core'
import { BaseCommand } from '../../../../base-command.js'
import { renderElementsList } from '../../../../dashboard-output.js'

export default class ContextDashboardsElementsList extends BaseCommand<typeof ContextDashboardsElementsList> {
  static description =
    'List every tile and filter on a dashboard draft, with the current draft revision. Replace PLACEHOLDER_DASHBOARD_ID with a real dashboard id from your org.'

  static examples = [
    '<%= config.bin %> context dashboards elements list PLACEHOLDER_DASHBOARD_ID',
    '<%= config.bin %> context dashboards elements list PLACEHOLDER_DASHBOARD_ID --pretty',
  ]

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const listed = await mgmt.context.dashboards.elements(this.args.dashboardId).list()
    this.print(listed, () => renderElementsList(listed))
  }
}
