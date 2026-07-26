import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ContextItemsGet extends BaseCommand<typeof ContextItemsGet> {
  static description = 'Get a context item by uid.'

  static args = {
    uid: Args.string({ description: 'Context item uid.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const item = await client.context.items.get(this.args.uid)
    this.print(item, () => JSON.stringify(item, null, 2))
  }
}
