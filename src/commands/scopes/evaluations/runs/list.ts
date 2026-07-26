import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../../base-command.js'
import { pageEnvelope, renderPage } from '../../../../output.js'

export default class ScopesEvaluationsRunsList extends BaseCommand<typeof ScopesEvaluationsRunsList> {
  static description = "List a scope's evaluation runs."

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'page-size': Flags.integer({ description: 'Items per page (default 25).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const page = await mgmt.scopes.evaluations(this.args.id).listRuns({
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () => renderPage(page, ['id', 'status', 'startedAt']))
  }
}
