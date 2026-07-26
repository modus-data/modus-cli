import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ScopesVariationsGet extends BaseCommand<typeof ScopesVariationsGet> {
  static description = 'Get a specific saved variation (draft or a past published version) of a scope.'

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
    variationUid: Args.string({ description: 'Variation uid.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const scope = await mgmt.scopes.getVariation(this.args.id, { variationUid: this.args.variationUid })
    this.print(scope, () => JSON.stringify(scope, null, 2))
  }
}
