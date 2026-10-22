import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../../base-command.js'
import { promptConfirm } from '../../../../prompt.js'
import { deleteConfirmation } from '../../interfaces/delete.js'

export default class ScopesEvaluationsCasesDelete extends BaseCommand<typeof ScopesEvaluationsCasesDelete> {
  static description = "Remove one evaluation case from a scope. Asks for confirmation unless --yes is passed."

  static examples = [
    '<%= config.bin %> scopes evaluations cases delete 42 CASE_ID --yes',
  ]

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
    caseId: Args.string({ description: 'Evaluation case id.', required: true }),
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
      && !(await promptConfirm(`Remove evaluation case ${this.args.caseId} from scope ${this.args.id}?`))
    ) {
      this.log('Cancelled.')
      return
    }

    const mgmt = await this.modusManagement()
    await mgmt.scopes.evaluations(this.args.id).deleteCase(this.args.caseId)
    this.print(
      { deleted: true, caseId: this.args.caseId },
      () => `Deleted evaluation case ${this.args.caseId}.`,
    )
  }
}
