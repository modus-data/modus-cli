import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../../input.js'

export default class ScopesInterfacesUpdate extends BaseCommand<typeof ScopesInterfacesUpdate> {
  static description = "Update one of a scope's interfaces."

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
    interfaceId: Args.string({ description: 'Interface id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({ description: 'New display name.' }),
    file: Flags.string({ description: 'Path to a JSON file with update fields (e.g. a new config).' }),
    body: Flags.string({ description: "Read update fields as JSON from stdin ('-')." }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, { name: this.flags.name })

    const mgmt = await this.modusManagement()
    const iface = mgmt.scopes.interfaces(this.args.id)
    const updated = await iface.update(this.args.interfaceId, body as Parameters<typeof iface.update>[1])
    this.print(updated, () => JSON.stringify(updated, null, 2))
  }
}
