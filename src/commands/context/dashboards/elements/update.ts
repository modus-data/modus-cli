import { Args, Flags } from '@oclif/core'
import type { UpdateDashboardElementInput } from '@getmodus/sdk/management'
import { BaseCommand } from '../../../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../../../input.js'

export default class ContextDashboardsElementsUpdate extends BaseCommand<typeof ContextDashboardsElementsUpdate> {
  static description =
    'Change settings of one tile or filter on a dashboard draft. Settings other than the title go in "patch" via --file/--body; null clears a setting that supports clearing.'

  static examples = [
    '<%= config.bin %> context dashboards elements update PLACEHOLDER_DASHBOARD_ID PLACEHOLDER_ELEMENT_ID --expected-revision 3 --title Revenue',
    '<%= config.bin %> context dashboards elements update PLACEHOLDER_DASHBOARD_ID PLACEHOLDER_ELEMENT_ID --file patch.json',
    'echo \'{"patch":{"defaultValue":null}}\' | <%= config.bin %> context dashboards elements update PLACEHOLDER_DASHBOARD_ID PLACEHOLDER_ELEMENT_ID --body - --expected-revision 3',
  ]

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
    elementId: Args.string({ description: 'Tile or filter id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file with the full update body ({ expectedRevision, patch }).' }),
    body: Flags.string({ description: "Read the full update body as JSON from stdin ('-')." }),
    'expected-revision': Flags.integer({ description: 'Draft revision the change is based on.' }),
    title: Flags.string({ description: 'New title; merged into "patch".' }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const filePatch = (fileBody.patch ?? {}) as Record<string, unknown>
    const body = mergeJsonBody(fileBody, {
      expectedRevision: this.flags['expected-revision'],
      patch: mergeJsonBody(filePatch, { title: this.flags.title }),
    })

    const mgmt = await this.modusManagement()
    const dashboard = await mgmt.context.dashboards
      .elements(this.args.dashboardId)
      .update(this.args.elementId, body as unknown as UpdateDashboardElementInput)
    this.print(dashboard, () => JSON.stringify(dashboard, null, 2))
  }
}
