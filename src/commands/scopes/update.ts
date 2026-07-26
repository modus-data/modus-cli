import { Args, Flags } from '@oclif/core'
import type { UpdateScopeOptions } from '@getmodus/sdk/management'
import { BaseCommand } from '../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../input.js'

export default class ScopesUpdate extends BaseCommand<typeof ScopesUpdate> {
  static description = 'Update a scope. Nested fields require --file/--body (see `scopes create --example`).'

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file with update fields.' }),
    body: Flags.string({ description: "Read update fields as JSON from stdin ('-')." }),
    name: Flags.string({ description: 'Scope display name.' }),
    description: Flags.string({ description: 'One-paragraph description.' }),
    model: Flags.string({ description: 'Model identifier (e.g. claude-sonnet-5).' }),
    instruction: Flags.string({ description: 'System-prompt instruction fragment (repeatable).', multiple: true }),
    guardrail: Flags.string({ description: 'Guardrail id (repeatable).', multiple: true }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, {
      name: this.flags.name,
      description: this.flags.description,
      model: this.flags.model,
      instructions: this.flags.instruction,
      guardrails: this.flags.guardrail,
    })

    const mgmt = await this.modusManagement()
    const scope = await mgmt.scopes.update(this.args.id, body as unknown as UpdateScopeOptions)
    this.print(scope, () => JSON.stringify(scope, null, 2))
  }
}
