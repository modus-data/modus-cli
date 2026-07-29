import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { pageEnvelope, renderPage } from '../../../output.js'
import { checkPageSize } from '../../../validation.js'

export default class ContextItemsList extends BaseCommand<typeof ContextItemsList> {
  static description = 'List organization context items (notes, links, saved queries, and more).'

  static examples = [
    '<%= config.bin %> context items list',
    '<%= config.bin %> context items list --pretty',
    '<%= config.bin %> context items list --context-type note',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    'context-type': Flags.string({ description: 'Filter by context type (e.g. note, link, saved_query).' }),
    'page-size': Flags.integer({ description: 'Items per page (default 25, max 200).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    checkPageSize(this.flags['page-size'], 200)
    const client = await this.modusClient()
    const page = await client.context.items.list({
      contextType: this.flags['context-type'],
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () => renderPage(page, ['uid', 'contextType', 'description']))
  }
}
