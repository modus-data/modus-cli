import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ScopesMemoriesSearch extends BaseCommand<typeof ScopesMemoriesSearch> {
  static description = "Semantic search over a scope's long-term memories."

  static examples = ['<%= config.bin %> scopes memories search 42 "user preferences for response style"']

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
    query: Args.string({ description: 'Search query.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'user-id': Flags.string({ description: 'Narrow results to memories tagged with this end-user id.' }),
    limit: Flags.integer({ description: 'Max results (default 10).' }),
  }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const result = await mgmt.scopes.memories(this.args.id).search({
      query: this.args.query,
      userId: this.flags['user-id'],
      limit: this.flags.limit,
    })
    this.print(result, () => JSON.stringify(result, null, 2))
  }
}
