import { Args } from '@oclif/core'
import { BaseCommand } from '../../../../base-command.js'

export default class ContextDashboardsVersionsRestore extends BaseCommand<typeof ContextDashboardsVersionsRestore> {
  static description =
    'Replace the draft with the content of an earlier version or draft snapshot. The replaced draft is kept as a snapshot; publish afterwards to make the restored content visible.'

  static examples = [
    '<%= config.bin %> context dashboards versions restore PLACEHOLDER_DASHBOARD_ID PLACEHOLDER_VERSION_ID',
  ]

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
    versionId: Args.string({ description: 'Version or draft snapshot id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const dashboard = await mgmt.context.dashboards.restoreVersion(this.args.dashboardId, this.args.versionId)
    this.print(dashboard, () => JSON.stringify(dashboard, null, 2))
  }
}
