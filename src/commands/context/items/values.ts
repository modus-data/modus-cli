import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { pageEnvelope, renderPage } from '../../../output.js'

export default class ContextItemsValues extends BaseCommand<typeof ContextItemsValues> {
  static description = 'List the sampled values for a context item field (e.g. a table column).'

  static args = {
    uid: Args.string({ description: 'Context item uid.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'context-type': Flags.string({ description: 'Context type of the item.', required: true }),
    'content-key-path': Flags.string({ description: 'Dot-path to the field within content (e.g. columns.email).', required: true }),
    'page-size': Flags.integer({ description: 'Items per page (default 25).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const page = await client.context.items.listValues(
      this.args.uid,
      this.flags['context-type'],
      this.flags['content-key-path'],
      { pageSize: this.flags['page-size'], pageToken: this.flags['page-token'] },
    )
    this.print(pageEnvelope(page), () => renderPage(page, Object.keys(page.items[0] ?? {})))
  }
}
