import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { pageEnvelope, renderPage } from '../../output.js'
import { checkPageSize } from '../../validation.js'

export default class ScopesList extends BaseCommand<typeof ScopesList> {
  static description = 'List scopes in the authenticated organization.'

  static examples = [
    '<%= config.bin %> scopes list',
    '<%= config.bin %> scopes list --pretty',
    '<%= config.bin %> scopes list --search revenue',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    search: Flags.string({ description: 'Filter by search term.' }),
    'page-size': Flags.integer({ description: 'Items per page (default 25, max 100).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    checkPageSize(this.flags['page-size'], 100)
    const client = await this.modusClient()
    const page = await client.scopes.list({
      search: this.flags.search,
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () => renderPage(page, ['id', 'slug', 'name', 'status']))
  }
}
