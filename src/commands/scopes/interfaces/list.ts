import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { renderTable } from '../../../output.js'

export default class ScopesInterfacesList extends BaseCommand<typeof ScopesInterfacesList> {
  static description = "List a scope's chat interfaces."

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const interfaces = await mgmt.scopes.interfaces(this.args.id).list()
    this.print(interfaces, () =>
      renderTable(interfaces as unknown as Array<Record<string, unknown>>, ['id', 'type', 'name', 'updatedAt']),
    )
  }
}
