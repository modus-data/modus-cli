import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class ContextCompose extends BaseCommand<typeof ContextCompose> {
  static description =
    'Compose the org-level context Modus would retrieve for a message, without running a chat turn.'

  static args = {
    message: Args.string({ description: 'Message to compose context for (quote it).', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({ description: 'Max context items to return.' }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const composition = await client.modus.getContext(this.args.message, { limit: this.flags.limit })
    this.print(composition, () => JSON.stringify(composition, null, 2))
  }
}
