import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { pageEnvelope, renderPage } from '../../output.js'
import { checkPageSize } from '../../validation.js'

export default class ConnectionsList extends BaseCommand<typeof ConnectionsList> {
  static description = 'List integration connections the caller can use.'

  static flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({ description: 'Filter by integration category (e.g. postgresql, bigquery).' }),
    'page-size': Flags.integer({ description: 'Items per page (default 25, max 100).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    checkPageSize(this.flags['page-size'], 100)
    const client = await this.modusClient()
    const page = await client.connections.list({
      type: this.flags.type,
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () => renderPage(page, ['id', 'name', 'type']))
  }
}
