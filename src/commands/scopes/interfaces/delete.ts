import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { promptConfirm } from '../../../prompt.js'

/** `--yes` skips the question; without it a terminal is asked and a pipe is refused. */
export function deleteConfirmation(options: { yes: boolean; interactive: boolean }): 'proceed' | 'prompt' | 'refuse' {
  if (options.yes) return 'proceed'
  return options.interactive ? 'prompt' : 'refuse'
}

export default class ScopesInterfacesDelete extends BaseCommand<typeof ScopesInterfacesDelete> {
  static description = "Remove one of a scope's interfaces. Asks for confirmation unless --yes is passed."

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
    interfaceId: Args.string({ description: 'Interface id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({ char: 'y', description: 'Delete without asking for confirmation.', default: false }),
  }

  async run(): Promise<void> {
    const decision = deleteConfirmation({ yes: this.flags.yes, interactive: Boolean(process.stdin.isTTY) })
    if (decision === 'refuse') {
      this.error('Refusing to delete without confirmation. Pass --yes to delete non-interactively.', { exit: 2 })
    }
    if (
      decision === 'prompt'
      && !(await promptConfirm(`Remove interface ${this.args.interfaceId} from scope ${this.args.id}?`))
    ) {
      this.log('Cancelled.')
      return
    }

    const mgmt = await this.modusManagement()
    await mgmt.scopes.interfaces(this.args.id).delete(this.args.interfaceId)
    this.print({ deleted: true, interfaceId: this.args.interfaceId }, () => `Deleted interface ${this.args.interfaceId}.`)
  }
}
