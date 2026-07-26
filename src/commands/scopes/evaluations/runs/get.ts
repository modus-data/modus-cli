import { Args } from '@oclif/core'
import { BaseCommand } from '../../../../base-command.js'

export default class ScopesEvaluationsRunsGet extends BaseCommand<typeof ScopesEvaluationsRunsGet> {
  static description = 'Get a single evaluation run, including its per-case results.'

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
    runId: Args.string({ description: 'Evaluation run id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const run = await mgmt.scopes.evaluations(this.args.id).getRun(this.args.runId)
    this.print(run, () => JSON.stringify(run, null, 2))
  }
}
