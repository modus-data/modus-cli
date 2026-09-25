import { Args } from '@oclif/core'
import { BaseCommand } from '../../../../base-command.js'
import { renderDraftSnapshots } from '../../../../dashboard-output.js'

export default class ContextDashboardsSnapshotsList extends BaseCommand<typeof ContextDashboardsSnapshotsList> {
  static description =
    'List recent snapshots of a dashboard draft, newest first. Pass a snapshot id to `context dashboards versions restore` to bring that draft back.'

  static examples = [
    '<%= config.bin %> context dashboards snapshots list PLACEHOLDER_DASHBOARD_ID',
    '<%= config.bin %> context dashboards snapshots list PLACEHOLDER_DASHBOARD_ID --pretty',
  ]

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const snapshots = await mgmt.context.dashboards.listDraftSnapshots(this.args.dashboardId)
    this.print(snapshots, () => renderDraftSnapshots(snapshots))
  }
}
