import { Args, Flags } from '@oclif/core'
import type { UpdateWorkflowOptions } from '@getmodus/sdk/management'
import { BaseCommand } from '../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../input.js'

export default class WorkflowsUpdate extends BaseCommand<typeof WorkflowsUpdate> {
  static description = 'Update a workflow. Nested fields require --file/--body (see `workflows create --example`).'

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file with update fields.' }),
    body: Flags.string({ description: "Read update fields as JSON from stdin ('-')." }),
    name: Flags.string({ description: 'Workflow display name.' }),
    description: Flags.string({ description: 'One-paragraph description.' }),
    guardrail: Flags.string({ description: 'Guardrail id (repeatable).', multiple: true }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, {
      name: this.flags.name,
      description: this.flags.description,
      guardrails: this.flags.guardrail,
    })

    const mgmt = await this.modusManagement()
    const workflow = await mgmt.workflows.update(this.args.id, body as unknown as UpdateWorkflowOptions)
    this.print(workflow, () => JSON.stringify(workflow, null, 2))
  }
}
