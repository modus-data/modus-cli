import { randomUUID } from 'node:crypto'
import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../../../input.js'

export default class ScopesEvaluationsCasesAdd extends BaseCommand<typeof ScopesEvaluationsCasesAdd> {
  static description = 'Add one evaluation case to a scope. Omit --case-id and one is assigned.'

  static examples = [
    '<%= config.bin %> scopes evaluations cases add 42 --task "Summarize revenue" --expected-output "A one-paragraph summary"',
  ]

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    task: Flags.string({ description: 'What the scope should do. An empty string is allowed.' }),
    'expected-output': Flags.string({ description: 'What a correct result looks like. An empty string is allowed.' }),
    'case-id': Flags.string({ description: 'Stable case id. Omit it and one is assigned.' }),
    file: Flags.string({ description: 'Path to a JSON file with the case body.' }),
    body: Flags.string({ description: "Read the case body as JSON from stdin ('-')." }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, {
      task: this.flags.task,
      expectedOutput: this.flags['expected-output'],
      id: this.flags['case-id'],
    })
    if (body.id === undefined) body.id = randomUUID()
    if (typeof body.task !== 'string' || typeof body.expectedOutput !== 'string') {
      this.error('--task and --expected-output are required (or include them via --file/--body).', { exit: 3 })
    }

    const mgmt = await this.modusManagement()
    const evaluations = mgmt.scopes.evaluations(this.args.id)
    const added = await evaluations.addCase(body as Parameters<typeof evaluations.addCase>[0])
    this.print(added, () => JSON.stringify(added, null, 2))
  }
}
