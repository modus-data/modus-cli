import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../../base-command.js'

export default class ContextDashboardsOwnershipRequest extends BaseCommand<typeof ContextDashboardsOwnershipRequest> {
  static description =
    'Ask another member of your organization to take ownership of a dashboard (run as the owner). Ownership moves when they run `context dashboards ownership accept`.'

  static examples = [
    '<%= config.bin %> context dashboards ownership request PLACEHOLDER_DASHBOARD_ID --new-owner-user-id PLACEHOLDER_USER_ID',
  ]

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'new-owner-user-id': Flags.string({ description: 'User id of the new owner.', required: true }),
  }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const dashboard = await mgmt.context.dashboards.requestOwnershipTransfer(this.args.dashboardId, {
      newOwnerUserId: this.flags['new-owner-user-id'],
    })
    this.print(dashboard, () => JSON.stringify(dashboard, null, 2))
  }
}
