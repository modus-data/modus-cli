import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { pageEnvelope, renderPage } from '../../../output.js'
import { checkPageSize } from '../../../validation.js'

export default class ContextFilesList extends BaseCommand<typeof ContextFilesList> {
  static description =
    'List durable file uploads in the org. In-flight uploads may only appear after `context files get` until they land.'

  static examples = [
    '<%= config.bin %> context files list',
    '<%= config.bin %> context files list --page-size 50 --pretty',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    'page-size': Flags.integer({ description: 'Items per page (default 50, max 200).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    checkPageSize(this.flags['page-size'], 200)
    const mgmt = await this.modusManagement()
    const page = await mgmt.context.files.list({
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () => renderPage(page, ['uploadId', 'fileName', 'status', 'contentType']))
  }
}
