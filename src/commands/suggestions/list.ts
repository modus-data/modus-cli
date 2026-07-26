import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { pageEnvelope, renderPage } from '../../output.js'
import { checkPageSize } from '../../validation.js'

export default class SuggestionsList extends BaseCommand<typeof SuggestionsList> {
  static description = 'List approved Home suggestion questions.'

  static flags = {
    ...BaseCommand.baseFlags,
    'scope-id': Flags.integer({ description: 'Filter to a single scope id.' }),
    'scope-ids': Flags.string({ description: 'Filter to a comma-separated list of scope ids.' }),
    'page-size': Flags.integer({ description: 'Items per page (default 5, max 12).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    checkPageSize(this.flags['page-size'], 12)
    const client = await this.modusClient()
    const page = await client.suggestions.list({
      scopeId: this.flags['scope-id'],
      scopeIds: this.flags['scope-ids']?.split(',').map((raw) => {
        const value = raw.trim()
        const id = Number(value)
        if (!value || !Number.isSafeInteger(id)) this.error(`Invalid scope id: ${raw}`, { exit: 3 })
        return id
      }),
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () => renderPage(page, ['id', 'label', 'skillId']))
  }
}
