import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ScopesConversationsGet extends BaseCommand<typeof ScopesConversationsGet> {
  static description = 'Get a single conversation thread for a scope, including its messages.'

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
    threadId: Args.string({ description: 'Conversation thread id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'message-limit': Flags.integer({ description: 'Max messages to return.' }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const conversation = await client.scopes
      .conversations(this.args.id)
      .get(this.args.threadId, { messageLimit: this.flags['message-limit'] })
    this.print(conversation, () => JSON.stringify(conversation, null, 2))
  }
}
