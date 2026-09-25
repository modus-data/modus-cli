import { Args, Flags } from '@oclif/core'
import type { UpdateDashboardAccessInput } from '@getmodus/sdk/management'
import { BaseCommand } from '../../../../base-command.js'
import { readJsonBody } from '../../../../input.js'

export default class ContextDashboardsAccessUpdate extends BaseCommand<typeof ContextDashboardsAccessUpdate> {
  static description =
    'Replace who can open and edit a dashboard. The body ({ visibility, groupPermissions, sharedWith }) comes from --file or --body -; all three settings replace the current ones.'

  static examples = [
    '<%= config.bin %> context dashboards access update PLACEHOLDER_DASHBOARD_ID --file access.json',
    'echo \'{"visibility":"private","groupPermissions":{},"sharedWith":[{"email":"ana@example.com","permission":"use"}]}\' | <%= config.bin %> context dashboards access update PLACEHOLDER_DASHBOARD_ID --body -',
  ]

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file with the full access body.', exactlyOne: ['file', 'body'] }),
    body: Flags.string({ description: "Read the full access body as JSON from stdin ('-').", exactlyOne: ['file', 'body'] }),
  }

  async run(): Promise<void> {
    const body = await readJsonBody({ file: this.flags.file, body: this.flags.body })

    const mgmt = await this.modusManagement()
    const dashboard = await mgmt.context.dashboards.updateAccess(
      this.args.dashboardId,
      body as unknown as UpdateDashboardAccessInput,
    )
    this.print(dashboard, () => JSON.stringify(dashboard, null, 2))
  }
}
