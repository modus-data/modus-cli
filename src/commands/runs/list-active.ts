import { Flags } from '@oclif/core'
import type { Page } from '@getmodus/sdk'
import { BaseCommand } from '../../base-command.js'
import { pageEnvelope, renderPage } from '../../output.js'
import { checkPageSize } from '../../validation.js'

export default class RunsListActive extends BaseCommand<typeof RunsListActive> {
  static description = 'List currently active (queued/pending/running) runs across the org.'

  static flags = {
    ...BaseCommand.baseFlags,
    'page-size': Flags.integer({ description: 'Items per page (default 50, max 100).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    checkPageSize(this.flags['page-size'], 100)
    const client = await this.modusClient()
    const page = await client.workflows.runs.active({
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () =>
      renderPage(page as unknown as Page<Record<string, unknown>>, ['runId', 'sessionId', 'status', 'createdAt']),
    )
  }
}
