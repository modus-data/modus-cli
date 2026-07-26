import { Args } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class ScopesDelete extends BaseCommand<typeof ScopesDelete> {
  static description = 'Delete a scope.'

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    await mgmt.scopes.delete(this.args.id)
    this.print({ deleted: true, id: this.args.id }, () => `Deleted scope ${this.args.id}.`)
  }
}
