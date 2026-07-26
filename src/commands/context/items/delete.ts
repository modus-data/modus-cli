import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ContextItemsDelete extends BaseCommand<typeof ContextItemsDelete> {
  static description = 'Delete a context item.'

  static args = {
    uid: Args.string({ description: 'Context item uid.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const result = await mgmt.context.items.delete(this.args.uid)
    this.print(result, () => `Deleted context item ${this.args.uid}.`)
  }
}
