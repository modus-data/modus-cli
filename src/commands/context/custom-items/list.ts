import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { pageEnvelope, renderPage } from '../../../output.js'
import { checkPageSize } from '../../../validation.js'

export default class ContextCustomItemsList extends BaseCommand<typeof ContextCustomItemsList> {
  static description = 'List custom context items.'

  static flags = {
    ...BaseCommand.baseFlags,
    'search-query': Flags.string({ description: 'Filter by search term.' }),
    topic: Flags.string({ description: 'Filter by topic tag (repeatable).', multiple: true }),
    'page-size': Flags.integer({ description: 'Items per page (default 25, max 200).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    checkPageSize(this.flags['page-size'], 200)
    const client = await this.modusClient()
    const page = await client.context.customItems.list({
      searchQuery: this.flags['search-query'],
      topics: this.flags.topic,
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () => renderPage(page, ['uid', 'contextType', 'description']))
  }
}
