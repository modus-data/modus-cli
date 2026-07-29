import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { pageEnvelope, renderPage } from '../../output.js'

export default class ToolsList extends BaseCommand<typeof ToolsList> {
  static description =
    'List tool/integration surfaces a scope can select in its toolset. Requires a published @getmodus/sdk that exposes ModusManagement.tools.'

  static examples = ['<%= config.bin %> tools list', '<%= config.bin %> tools list --pretty']

  static flags = {
    ...BaseCommand.baseFlags,
    'page-size': Flags.integer({ description: 'Items per page (default 25, max 100).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const page = await mgmt.tools.list({
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () => renderPage(page, ['id', 'displayName', 'category', 'requiresConnection']))
  }
}
