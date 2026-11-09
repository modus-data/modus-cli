import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { renderTable } from '../../../output.js'

export default class ContextItemsQuery extends BaseCommand<typeof ContextItemsQuery> {
  static description = 'Run one read-only SQL statement over the context_items table. It sees only the items you can read.'

  static examples = [
    `<%= config.bin %> context items query "SELECT context_type, count(*) AS items FROM context_items GROUP BY 1" --pretty`,
  ]

  static args = {
    sql: Args.string({ description: 'The SELECT statement to run.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'max-rows': Flags.integer({ description: 'The most rows to return (1-1000, default 1000).', min: 1, max: 1000 }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const maxRows = this.flags['max-rows']
    const result = await client.context.items.query({ sql: this.args.sql, ...(maxRows !== undefined ? { maxRows } : {}) })
    this.print(result, () => {
      const columns = Object.keys(result.rows[0] ?? {})
      const table = columns.length ? renderTable(result.rows, columns) : '(no rows)'
      return result.truncated ? `${table}\n(truncated at ${result.rowCount} rows)` : table
    })
  }
}
