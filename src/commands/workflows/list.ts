import { Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { pageEnvelope, renderPage } from '../../output.js'
import { checkPageSize } from '../../validation.js'

export default class WorkflowsList extends BaseCommand<typeof WorkflowsList> {
  static description = 'List workflows in the authenticated organization.'

  static examples = [
    '<%= config.bin %> workflows list',
    '<%= config.bin %> workflows list --pretty',
    '<%= config.bin %> workflows list --type task',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    search: Flags.string({ description: 'Filter by search term.' }),
    type: Flags.string({ description: 'Filter by workflow type.', options: ['task', 'workflow'] }),
    'page-size': Flags.integer({ description: 'Items per page (default 25, max 100).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    checkPageSize(this.flags['page-size'], 100)
    const client = await this.modusClient()
    const page = await client.workflows.list({
      search: this.flags.search,
      type: this.flags.type as 'task' | 'workflow' | undefined,
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () => renderPage(page, ['id', 'slug', 'name', 'type', 'status']))
  }
}
