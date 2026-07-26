import { Args } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { renderTable } from '../../output.js'

export default class ScopesGet extends BaseCommand<typeof ScopesGet> {
  static description = 'Get a scope by id.'

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const scope = await client.scopes.get(this.args.id)
    this.print(scope, () =>
      renderTable([scope as unknown as Record<string, unknown>], ['id', 'slug', 'name', 'status', 'description']),
    )
  }
}
