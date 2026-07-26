import { Args, Flags } from '@oclif/core'
import type { RunStatus } from '@getmodus/sdk'
import { BaseCommand } from '../../../base-command.js'
import { pageEnvelope, renderPage } from '../../../output.js'
import { checkPageSize } from '../../../validation.js'

export default class WorkflowsRunsList extends BaseCommand<typeof WorkflowsRunsList> {
  static description = "List a workflow's past runs."

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    status: Flags.string({ description: 'Filter by run status.' }),
    search: Flags.string({ description: 'Filter by search term.' }),
    'page-size': Flags.integer({ description: 'Items per page (default 25, max 100).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    checkPageSize(this.flags['page-size'], 100)
    const client = await this.modusClient()
    const page = await client.workflows.runs.list(this.args.id, {
      status: this.flags.status as RunStatus | undefined,
      search: this.flags.search,
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () => renderPage(page, ['id', 'status', 'triggerType', 'startedAt']))
  }
}
