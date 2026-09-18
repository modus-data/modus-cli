import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { pageEnvelope, renderPage } from '../../../output.js'
import { checkPageSize } from '../../../validation.js'

export default class ScopesConversationsList extends BaseCommand<typeof ScopesConversationsList> {
  static description = "List a scope's conversation threads (newest first)."

  static examples = [
    '<%= config.bin %> scopes conversations list 42',
    '<%= config.bin %> scopes conversations list 42 --pretty --page-size 10',
  ]

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    source: Flags.string({ description: 'Restrict to conversations started from this UI surface (e.g. context_chat, dashboard_copilot, slack).' }),
    'source-ref': Flags.string({ description: 'Narrow --source to one instance of that surface (e.g. a dashboard id for dashboard_copilot). Requires --source.' }),
    'page-size': Flags.integer({ description: 'Items per page (default 25, max 100).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    checkPageSize(this.flags['page-size'], 100)
    const client = await this.modusClient()
    const page = await client.scopes.conversations(this.args.id).list({
      source: this.flags.source,
      sourceRef: this.flags['source-ref'],
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () =>
      renderPage(page, ['threadId', 'firstMessage', 'messageCount', 'updatedAt']),
    )
  }
}
