import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ScopesEvaluationsTriggerRun extends BaseCommand<typeof ScopesEvaluationsTriggerRun> {
  static description = 'Manually trigger an evaluation run for a scope.'

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const result = await mgmt.scopes.evaluations(this.args.id).triggerRun()
    this.print(result, () => JSON.stringify(result, null, 2))
  }
}
