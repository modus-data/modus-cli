import { Flags } from '@oclif/core'
import type { CreateScopeOptions } from '@getmodus/sdk/management'
import { BaseCommand } from '../../base-command.js'
import { readExampleFixture } from '../../examples.js'
import { mergeJsonBody, readJsonBody } from '../../input.js'

export default class ScopesCreate extends BaseCommand<typeof ScopesCreate> {
  static description = 'Create a scope. Nested fields (toolset, connectionSet, contextSelections, interfaces) require --file/--body — see --example.'

  static examples = [
    '<%= config.bin %> scopes create --example > scope.json',
    '<%= config.bin %> scopes create --file scope.json',
    '<%= config.bin %> scopes create --name "Revenue Analyst" --model claude-sonnet-5',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    example: Flags.boolean({ description: 'Print an example scope JSON to stdout and exit.' }),
    file: Flags.string({ description: 'Path to a JSON file with the full create body.' }),
    body: Flags.string({ description: "Read the full create body as JSON from stdin ('-')." }),
    name: Flags.string({ description: 'Scope display name.' }),
    description: Flags.string({ description: 'One-paragraph description.' }),
    model: Flags.string({ description: 'Model identifier (e.g. claude-sonnet-5).' }),
    instruction: Flags.string({ description: 'System-prompt instruction fragment (repeatable).', multiple: true }),
    guardrail: Flags.string({ description: 'Guardrail id (repeatable).', multiple: true }),
  }

  async run(): Promise<void> {
    if (this.flags.example) {
      this.log(await readExampleFixture('scope-full.json'))
      return
    }

    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, {
      name: this.flags.name,
      description: this.flags.description,
      model: this.flags.model,
      instructions: this.flags.instruction,
      guardrails: this.flags.guardrail,
    })

    if (typeof body.name !== 'string' || !body.name) {
      this.error('A name is required — pass --name or include "name" via --file/--body.', { exit: 3 })
    }

    const mgmt = await this.modusManagement()
    const scope = await mgmt.scopes.create(body as unknown as CreateScopeOptions)
    this.print(scope, () => JSON.stringify(scope, null, 2))
  }
}
