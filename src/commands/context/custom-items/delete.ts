import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ContextCustomItemsDelete extends BaseCommand<typeof ContextCustomItemsDelete> {
  static description = 'Delete a custom context item.'

  static args = {
    uid: Args.string({ description: 'Custom context item uid.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const result = await client.context.customItems.delete(this.args.uid)
    this.print(result, () => `Deleted custom context item ${this.args.uid}.`)
  }
}
