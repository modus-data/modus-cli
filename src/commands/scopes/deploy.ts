import { Args } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class ScopesDeploy extends BaseCommand<typeof ScopesDeploy> {
  static description = 'Deploy a scope (publish the current draft as the active variation).'

  static examples = [
    '<%= config.bin %> scopes deploy 42',
    '<%= config.bin %> scopes deploy 42 --pretty',
  ]

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const scope = await mgmt.scopes.deploy(this.args.id)
    this.print(scope, () => JSON.stringify(scope, null, 2))
  }
}
