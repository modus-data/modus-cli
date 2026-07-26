import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../../input.js'

export default class WorkflowsInterfacesAdd extends BaseCommand<typeof WorkflowsInterfacesAdd> {
  static description = 'Add an interface (slack, mcp, teams) to a workflow.'

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({ description: 'Interface type.', options: ['slack', 'mcp', 'teams'] }),
    name: Flags.string({ description: 'Display name for the interface.' }),
    file: Flags.string({ description: 'Path to a JSON file with the full body (for a non-empty config).' }),
    body: Flags.string({ description: "Read the full body as JSON from stdin ('-')." }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, { type: this.flags.type, name: this.flags.name })

    if (!body.type || !body.name) {
      this.error('--type and --name are required (or include them via --file/--body).', { exit: 3 })
    }

    const mgmt = await this.modusManagement()
    const iface = mgmt.workflows.interfaces(this.args.id)
    const added = await iface.create(body as Parameters<typeof iface.create>[0])
    this.print(added, () => JSON.stringify(added, null, 2))
  }
}
