import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ScopesSupervisionSetActive extends BaseCommand<typeof ScopesSupervisionSetActive> {
  static description =
    "Replace a scope's subordinate scope ids on the active (published) supervision config directly."

  static examples = [
    '<%= config.bin %> scopes supervision set-active 42 --subordinate-id 17 --subordinate-id 23',
  ]

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'subordinate-id': Flags.integer({
      description: 'Subordinate scope id (repeatable). Omit entirely to clear the list.',
      multiple: true,
    }),
  }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const supervision = await mgmt.scopes.supervision(this.args.id).setActive({
      subordinateAgentIds: this.flags['subordinate-id'] ?? [],
    })
    this.print(supervision, () => JSON.stringify(supervision, null, 2))
    // The API returns the pre-write state on this endpoint — run `get` for the current value.
    this.warn(`Response reflects state before this update — run \`scopes supervision get ${this.args.id}\` to see the current value.`)
  }
}
