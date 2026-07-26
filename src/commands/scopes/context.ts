import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class ScopesContext extends BaseCommand<typeof ScopesContext> {
  static description =
    'Compose the context a scope would retrieve for a message, without running a chat turn.'

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
    message: Args.string({ description: 'Message to compose context for (quote it).', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({ description: 'Max context items to return.' }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const composition = await client.scopes.getContext(this.args.id, this.args.message, {
      limit: this.flags.limit,
    })
    this.print(composition, () => JSON.stringify(composition, null, 2))
  }
}
