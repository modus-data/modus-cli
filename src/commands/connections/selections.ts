import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { pageEnvelope, renderPage } from '../../output.js'
import { checkPageSize } from '../../validation.js'

export default class ConnectionsSelections extends BaseCommand<typeof ConnectionsSelections> {
  static description = 'List the selectable units on a connection (a repository, a schema, a project).'

  static examples = [
    '<%= config.bin %> connections selections 7a3f9d2c-1111-4000-a000-000000000abc',
    '<%= config.bin %> connections selections 7a3f9d2c-1111-4000-a000-000000000abc --pretty',
    '<%= config.bin %> connections selections 7a3f9d2c-1111-4000-a000-000000000abc --page-size 50',
  ]

  static args = {
    id: Args.string({ description: 'Connection id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'page-size': Flags.integer({ description: 'Items per page (default 25, max 100).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    checkPageSize(this.flags['page-size'], 100)
    const client = await this.modusClient()
    const page = await client.connections.listSelections(this.args.id, {
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () => renderPage(page, ['objectType', 'displayName', 'path']))
  }
}
