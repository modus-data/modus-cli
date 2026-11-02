import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { renderTable } from '../../output.js'

export default class ScopesGet extends BaseCommand<typeof ScopesGet> {
  static description = 'Get a scope by id (full JSON, or a short table with --pretty).'

  static examples = ['<%= config.bin %> scopes get 42', '<%= config.bin %> scopes get 42 --pretty']

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    view: Flags.string({
      description: 'Which version to read. published is the published version you can use.',
      options: ['active', 'draft', 'published'],
    }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const scope = await client.scopes.get(this.args.id, {
      view: this.flags.view as 'active' | 'draft' | 'published' | undefined,
    })
    this.print(scope, () =>
      renderTable([scope as unknown as Record<string, unknown>], ['id', 'slug', 'name', 'status', 'description']),
    )
  }
}
