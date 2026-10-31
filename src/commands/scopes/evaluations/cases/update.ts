import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../../../input.js'

export default class ScopesEvaluationsCasesUpdate extends BaseCommand<typeof ScopesEvaluationsCasesUpdate> {
  static description = 'Change the task, the expected output, or both, for one evaluation case.'

  static examples = [
    '<%= config.bin %> scopes evaluations cases update 42 CASE_ID --task "Summarize revenue in two sentences"',
  ]

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
    caseId: Args.string({ description: 'Evaluation case id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    task: Flags.string({ description: 'Replacement for what the scope should do. An empty string is allowed.' }),
    'expected-output': Flags.string({ description: 'Replacement for what a correct result looks like. An empty string is allowed.' }),
    file: Flags.string({ description: 'Path to a JSON file with the fields to change.' }),
    body: Flags.string({ description: "Read the fields to change as JSON from stdin ('-')." }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, {
      task: this.flags.task,
      expectedOutput: this.flags['expected-output'],
    })

    const mgmt = await this.modusManagement()
    const evaluations = mgmt.scopes.evaluations(this.args.id)
    const updated = await evaluations.updateCase(
      this.args.caseId,
      body as Parameters<typeof evaluations.updateCase>[1],
    )
    this.print(updated, () => JSON.stringify(updated, null, 2))
  }
}
