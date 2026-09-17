import { Args, Flags } from '@oclif/core'
import type { UpdateDashboardLayoutInput } from '@getmodus/sdk/management'
import { BaseCommand } from '../../../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../../../input.js'

export default class ContextDashboardsLayoutUpdate extends BaseCommand<typeof ContextDashboardsLayoutUpdate> {
  static description =
    'Move or resize several tiles and filters on a dashboard draft in one change. The body ({ expectedRevision, elements: [{ elementId, layout }] }) comes from --file or --body -.'

  static examples = [
    '<%= config.bin %> context dashboards layout update PLACEHOLDER_DASHBOARD_ID --file layout.json',
    'echo \'{"elements":[{"elementId":"PLACEHOLDER_ELEMENT_ID","layout":{"x":0,"y":0,"w":12,"h":2}}]}\' | <%= config.bin %> context dashboards layout update PLACEHOLDER_DASHBOARD_ID --body - --expected-revision 3',
  ]

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file with the full layout body.', exactlyOne: ['file', 'body'] }),
    body: Flags.string({ description: "Read the full layout body as JSON from stdin ('-').", exactlyOne: ['file', 'body'] }),
    'expected-revision': Flags.integer({ description: 'Draft revision the change is based on; overrides the body value.' }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, { expectedRevision: this.flags['expected-revision'] })

    const mgmt = await this.modusManagement()
    const dashboard = await mgmt.context.dashboards.updateLayout(
      this.args.dashboardId,
      body as unknown as UpdateDashboardLayoutInput,
    )
    this.print(dashboard, () => JSON.stringify(dashboard, null, 2))
  }
}
