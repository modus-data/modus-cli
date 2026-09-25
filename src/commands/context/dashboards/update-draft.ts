import { Args, Flags } from '@oclif/core'
import type { UpdateDashboardDraftInput } from '@getmodus/sdk/management'
import { BaseCommand } from '../../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../../input.js'

export default class ContextDashboardsUpdateDraft extends BaseCommand<typeof ContextDashboardsUpdateDraft> {
  static description =
    'Replace the whole draft definition, and optionally the title and description. Tiles and filters left out of the definition are removed. Start from `context dashboards get --view draft`.'

  static examples = [
    '<%= config.bin %> context dashboards get PLACEHOLDER_DASHBOARD_ID --view draft > draft.json',
    '<%= config.bin %> context dashboards update-draft PLACEHOLDER_DASHBOARD_ID --file draft.json --expected-revision 3',
    'cat draft.json | <%= config.bin %> context dashboards update-draft PLACEHOLDER_DASHBOARD_ID --body - --expected-revision 3 --title "Revenue overview"',
  ]

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file with the update body ({ expectedRevision, definition, title, description }).' }),
    body: Flags.string({ description: "Read the update body as JSON from stdin ('-')." }),
    'expected-revision': Flags.integer({ description: 'Draft revision the change is based on; overrides the body value.' }),
    title: Flags.string({ description: 'New title.' }),
    description: Flags.string({ description: 'New description.' }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, {
      expectedRevision: this.flags['expected-revision'],
      title: this.flags.title,
      description: this.flags.description,
    })

    const mgmt = await this.modusManagement()
    const dashboard = await mgmt.context.dashboards.updateDraft(
      this.args.dashboardId,
      body as unknown as UpdateDashboardDraftInput,
    )
    this.print(dashboard, () => JSON.stringify(dashboard, null, 2))
  }
}
