import { Flags } from '@oclif/core'
import type { CreateWorkflowOptions } from '@getmodus/sdk/management'
import { BaseCommand } from '../../base-command.js'
import { readExampleFixture } from '../../examples.js'
import { mergeJsonBody, readJsonBody } from '../../input.js'

export default class WorkflowsCreate extends BaseCommand<typeof WorkflowsCreate> {
  static description =
    'Create a workflow. Nested fields (trigger, agentSelection, workflowStructure) require --file/--body — see --example.'

  static examples = [
    '<%= config.bin %> workflows create --example > workflow.json',
    '<%= config.bin %> workflows create --file workflow.json',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    example: Flags.boolean({ description: 'Print an example workflow JSON to stdout and exit.' }),
    file: Flags.string({ description: 'Path to a JSON file with the full create body.' }),
    body: Flags.string({ description: "Read the full create body as JSON from stdin ('-')." }),
    name: Flags.string({ description: 'Workflow display name.' }),
    type: Flags.string({ description: 'Workflow type.', options: ['task', 'workflow'], default: 'workflow' }),
    description: Flags.string({ description: 'One-paragraph description.' }),
    guardrail: Flags.string({ description: 'Guardrail id (repeatable).', multiple: true }),
  }

  async run(): Promise<void> {
    if (this.flags.example) {
      this.log(await readExampleFixture('workflow-full.json'))
      return
    }

    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, {
      name: this.flags.name,
      type: this.flags.type,
      description: this.flags.description,
      guardrails: this.flags.guardrail,
    })

    if (typeof body.name !== 'string' || !body.name) {
      this.error('A name is required — pass --name or include "name" via --file/--body.', { exit: 3 })
    }

    const mgmt = await this.modusManagement()
    const workflow = await mgmt.workflows.create(body as unknown as CreateWorkflowOptions)
    this.print(workflow, () => JSON.stringify(workflow, null, 2))
  }
}
