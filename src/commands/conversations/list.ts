import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { pageEnvelope, renderPage } from '../../output.js'
import { checkPageSize } from '../../validation.js'

export default class ConversationsList extends BaseCommand<typeof ConversationsList> {
  static description = 'List conversation threads across the org Modus assistant and all scopes.'

  static flags = {
    ...BaseCommand.baseFlags,
    kind: Flags.string({ description: 'Filter by conversation kind.', options: ['all', 'modus', 'scopes'] }),
    'page-size': Flags.integer({ description: 'Items per page (default 25, max 100).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    checkPageSize(this.flags['page-size'], 100)
    const client = await this.modusClient()
    const page = await client.modus.conversations.list({
      kind: this.flags.kind as 'all' | 'modus' | 'scopes' | undefined,
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () =>
      renderPage(page, ['threadId', 'firstMessage', 'messageCount', 'updatedAt']),
    )
  }
}
