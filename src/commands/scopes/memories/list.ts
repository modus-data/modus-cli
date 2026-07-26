import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { pageEnvelope, renderPage } from '../../../output.js'
import { checkPageSize } from '../../../validation.js'

export default class ScopesMemoriesList extends BaseCommand<typeof ScopesMemoriesList> {
  static description = "List a scope's long-term memories."

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'user-id': Flags.string({ description: 'Filter to memories tagged with this end-user id.' }),
    'page-size': Flags.integer({ description: 'Items per page (default 25).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    checkPageSize(this.flags['page-size'], 100)
    const mgmt = await this.modusManagement()
    const page = await mgmt.scopes.memories(this.args.id).list({
      userId: this.flags['user-id'],
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () => renderPage(page, ['id', 'memory', 'createdAt']))
  }
}
