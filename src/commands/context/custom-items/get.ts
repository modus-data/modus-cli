import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ContextCustomItemsGet extends BaseCommand<typeof ContextCustomItemsGet> {
  static description = 'Get a custom context item by uid.'

  static args = {
    uid: Args.string({ description: 'Custom context item uid.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const item = await client.context.customItems.get(this.args.uid)
    this.print(item, () => JSON.stringify(item, null, 2))
  }
}
