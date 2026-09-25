import { Args, Flags } from '@oclif/core'
import type { CreateDashboardElementInput } from '@getmodus/sdk/management'
import { BaseCommand } from '../../../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../../../input.js'

const LAYOUT_FLAGS = ['x', 'y', 'w', 'h']

export default class ContextDashboardsElementsCreate extends BaseCommand<typeof ContextDashboardsElementsCreate> {
  static description =
    'Create a blank tile or filter on a dashboard draft at a grid position. Pass the draft revision from `context dashboards elements list`; a stale revision is rejected.'

  static examples = [
    '<%= config.bin %> context dashboards elements create PLACEHOLDER_DASHBOARD_ID --expected-revision 3 --kind chart --title "Sales by region" --x 0 --y 4 --w 6 --h 4',
    '<%= config.bin %> context dashboards elements create PLACEHOLDER_DASHBOARD_ID --file element.json',
    'cat element.json | <%= config.bin %> context dashboards elements create PLACEHOLDER_DASHBOARD_ID --body - --expected-revision 4',
  ]

  static args = {
    dashboardId: Args.string({ description: 'Dashboard id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file with the full create body.' }),
    body: Flags.string({ description: "Read the full create body as JSON from stdin ('-')." }),
    'expected-revision': Flags.integer({ description: 'Draft revision the change is based on.' }),
    kind: Flags.string({
      description: 'Element to create.',
      options: ['chart', 'kpi', 'table', 'markdown', 'filter'],
    }),
    title: Flags.string({ description: 'Title shown on the element.' }),
    x: Flags.integer({ description: 'Left column, 0 through 11.', dependsOn: LAYOUT_FLAGS }),
    y: Flags.integer({ description: 'Top row, starting at 0.', dependsOn: LAYOUT_FLAGS }),
    w: Flags.integer({ description: 'Width in grid columns, 1 through 12.', dependsOn: LAYOUT_FLAGS }),
    h: Flags.integer({ description: 'Height in grid rows.', dependsOn: LAYOUT_FLAGS }),
  }

  async run(): Promise<void> {
    const { x, y, w, h } = this.flags
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, {
      expectedRevision: this.flags['expected-revision'],
      kind: this.flags.kind,
      title: this.flags.title,
      layout: x === undefined || y === undefined || w === undefined || h === undefined ? undefined : { x, y, w, h },
    })

    const mgmt = await this.modusManagement()
    const created = await mgmt.context.dashboards
      .elements(this.args.dashboardId)
      .create(body as unknown as CreateDashboardElementInput)
    this.print(created, () => JSON.stringify(created, null, 2))
  }
}
