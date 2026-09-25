import { Flags } from '@oclif/core'
import type { DashboardView } from '@getmodus/sdk/management'
import { BaseCommand } from '../../../base-command.js'
import { renderDashboardsList } from '../../../dashboard-output.js'

export default class ContextDashboardsList extends BaseCommand<typeof ContextDashboardsList> {
  static description =
    'List dashboards with their full definitions. The default view lists published dashboards you can open; --view draft lists the drafts of dashboards you can edit.'

  static examples = [
    '<%= config.bin %> context dashboards list',
    '<%= config.bin %> context dashboards list --view draft --pretty',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    view: Flags.string({ description: 'Which view to list (default active).', options: ['active', 'draft'] }),
  }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const dashboards = await mgmt.context.dashboards.list({ view: this.flags.view as DashboardView | undefined })
    this.print(dashboards, () => renderDashboardsList(dashboards))
  }
}
