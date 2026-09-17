import { Args } from '@oclif/core'
import { BaseCommand } from '../../../../base-command.js'
import { renderElement } from '../../../../dashboard-output.js'

export default class ContextDashboardsElementsGet extends BaseCommand<typeof ContextDashboardsElementsGet> {
  static description =
    'Get the full draft settings of one tile or filter. Replace the placeholders with ids from `context dashboards elements list`.'

  static examples = [
    '<%= config.bin %> context dashboards elements get PLACEHOLDER_DASHBOARD_ID PLACEHOLDER_ELEMENT_ID',
    '<%= config.bin %> context dashboards elements get PLACEHOLDER_DASHBOARD_ID PLACEHOLDER_ELEMENT_ID --pretty',
  ]

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
    elementId: Args.string({ description: 'Tile or filter id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const result = await mgmt.context.dashboards.elements(this.args.dashboardId).get(this.args.elementId)
    this.print(result, () => renderElement(result))
  }
}
