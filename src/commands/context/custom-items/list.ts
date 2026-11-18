import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { pageEnvelope, renderPage } from '../../../output.js'
import { checkPageSize } from '../../../validation.js'

export default class ContextCustomItemsList extends BaseCommand<typeof ContextCustomItemsList> {
  static description =
    'List custom context items in the org. Use --search-query or --topic to narrow results.'

  static examples = [
    '<%= config.bin %> context custom-items list',
    '<%= config.bin %> context custom-items list --search-query churn --pretty',
    '<%= config.bin %> context custom-items list --topic analytics --topic q3',
    '<%= config.bin %> context custom-items list --source-id billing-db --collection-id contracts',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    'search-query': Flags.string({
      description: 'Word search: returns rows that contain every word of the query, case-insensitive.',
    }),
    topic: Flags.string({ description: 'Filter by topic tag (repeatable).', multiple: true }),
    'source-id': Flags.string({
      description: 'Restrict to one customer-defined source and everything beneath it.',
    }),
    'collection-id': Flags.string({
      description: 'Restrict to one collection inside the source. Requires --source-id.',
    }),
    'external-id': Flags.string({
      description: 'Restrict to one entity inside the collection. Requires --source-id and --collection-id.',
    }),
    'page-size': Flags.integer({ description: 'Items per page (default 25, max 200).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    checkPageSize(this.flags['page-size'], 200)
    const client = await this.modusClient()
    const page = await client.context.customItems.list({
      searchQuery: this.flags['search-query'],
      topics: this.flags.topic,
      sourceId: this.flags['source-id'],
      collectionId: this.flags['collection-id'],
      externalId: this.flags['external-id'],
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () => renderPage(page, ['uid', 'contextType', 'description']))
  }
}
