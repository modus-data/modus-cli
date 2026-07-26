import { Args } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class ConversationsGet extends BaseCommand<typeof ConversationsGet> {
  static description = 'Get a single conversation thread (org Modus assistant or a scope), including its messages.'

  static args = {
    threadId: Args.string({ description: 'Conversation thread id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const conversation = await client.modus.conversations.get(this.args.threadId)
    this.print(conversation, () => JSON.stringify(conversation, null, 2))
  }
}
