import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ContextSavedQueriesCreate extends BaseCommand<typeof ContextSavedQueriesCreate> {
  static description = 'Save a SQL query against a connection as a context item.'

  static examples = [
    '<%= config.bin %> context saved-queries create "Monthly ARR" --connection-id conn_123 --query "select * from arr_monthly"',
  ]

  static args = {
    name: Args.string({ description: 'Saved query name.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'connection-id': Flags.string({ description: 'Connection this query runs against.', required: true }),
    query: Flags.string({ description: 'SQL query text.' }),
    description: Flags.string({ description: 'Description.' }),
    path: Flags.string({ description: 'Folder path segment (repeatable).', multiple: true }),
  }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const created = await mgmt.context.createSavedQuery(this.args.name, {
      query: this.flags.query,
      connectionId: this.flags['connection-id'],
      description: this.flags.description,
      path: this.flags.path,
    })
    this.print(created, () => JSON.stringify(created, null, 2))
  }
}
