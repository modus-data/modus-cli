import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ContextItemsLookup extends BaseCommand<typeof ContextItemsLookup> {
  static description = 'Look up a single context item by its (contextType, dataPath) identity instead of its uid.'

  static examples = [
    '<%= config.bin %> context items lookup --context-type saved_query --data-path conn-1 --data-path my-query',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    'context-type': Flags.string({ description: 'Context type of the item.', required: true }),
    'data-path': Flags.string({ description: 'Path segment (repeatable, in order).', multiple: true, required: true }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const row = await client.context.items.lookup({
      contextType: this.flags['context-type'],
      dataPath: this.flags['data-path'],
    })
    this.print(row ?? null, () => (row ? JSON.stringify(row, null, 2) : '(not found)'))
  }
}
