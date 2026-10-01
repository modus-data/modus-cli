import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../../input.js'

export default class ScopesInterfacesAdd extends BaseCommand<typeof ScopesInterfacesAdd> {
  static description = 'Add a chat interface to a deployed scope.'

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({ description: 'Interface type.', options: ['slack', 'teams'] }),
    name: Flags.string({ description: 'Display name (defaults to the chat platform name).' }),
    file: Flags.string({ description: 'Path to a JSON file with the full body (for a config).' }),
    body: Flags.string({ description: "Read the full body as JSON from stdin ('-')." }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, { type: this.flags.type, name: this.flags.name })

    if (!body.type) {
      this.error('--type is required (or include it via --file/--body).', { exit: 3 })
    }

    const mgmt = await this.modusManagement()
    const iface = mgmt.scopes.interfaces(this.args.id)
    const added = await iface.create(body as Parameters<typeof iface.create>[0])
    this.print(added, () => JSON.stringify(added, null, 2))
  }
}
