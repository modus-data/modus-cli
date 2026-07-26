import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ScopesEvaluationsGetConfig extends BaseCommand<typeof ScopesEvaluationsGetConfig> {
  static description = "Get a scope's scheduled-evaluation config."

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const config = await mgmt.scopes.evaluations(this.args.id).getConfig()
    this.print(config, () => JSON.stringify(config, null, 2))
  }
}
