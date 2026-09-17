import { Flags } from '@oclif/core'
import type { CreateDashboardInput } from '@getmodus/sdk/management'
import { BaseCommand } from '../../../base-command.js'
import { readExampleFixture } from '../../../examples.js'
import { mergeJsonBody, readJsonBody } from '../../../input.js'

export default class ContextDashboardsCreate extends BaseCommand<typeof ContextDashboardsCreate> {
  static description =
    'Create a dashboard draft. The definition (tiles, filters, layout) and access require --file/--body — see --example. Publish it with `context dashboards publish`.'

  static examples = [
    '<%= config.bin %> context dashboards create --example > dashboard.json',
    '<%= config.bin %> context dashboards create --file dashboard.json',
    '<%= config.bin %> context dashboards create --file dashboard.json --title "Revenue overview"',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    example: Flags.boolean({ description: 'Print an example dashboard JSON to stdout and exit.' }),
    file: Flags.string({ description: 'Path to a JSON file with the full create body.' }),
    body: Flags.string({ description: "Read the full create body as JSON from stdin ('-')." }),
    title: Flags.string({ description: 'Dashboard title.' }),
    description: Flags.string({ description: 'Dashboard description.' }),
  }

  async run(): Promise<void> {
    if (this.flags.example) {
      this.log(await readExampleFixture('dashboard-full.json'))
      return
    }

    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, { title: this.flags.title, description: this.flags.description })

    const mgmt = await this.modusManagement()
    const dashboard = await mgmt.context.dashboards.create(body as unknown as CreateDashboardInput)
    this.print(dashboard, () => JSON.stringify(dashboard, null, 2))
  }
}
