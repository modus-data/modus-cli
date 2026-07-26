import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../../input.js'

export default class ScopesEvaluationsUpdateConfig extends BaseCommand<typeof ScopesEvaluationsUpdateConfig> {
  static description =
    "Update a scope's scheduled-evaluation config. Nested fields (cadence, notifications) require --file/--body."

  static examples = [
    '<%= config.bin %> scopes evaluations update-config 42 --enabled --file cadence.json',
  ]

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file with update fields.' }),
    body: Flags.string({ description: "Read update fields as JSON from stdin ('-')." }),
    enabled: Flags.boolean({ description: 'Enable or disable scheduled evaluations.', allowNo: true }),
    'judge-model': Flags.string({ description: 'Model id for the judge LLM.' }),
    'judge-guidance': Flags.string({ description: 'Custom guidance for the judge LLM.' }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, {
      enabled: this.flags.enabled,
      judgeModel: this.flags['judge-model'],
      judgeGuidance: this.flags['judge-guidance'],
    })

    const mgmt = await this.modusManagement()
    const evaluations = mgmt.scopes.evaluations(this.args.id)
    const config = await evaluations.updateConfig(
      body as unknown as Parameters<typeof evaluations.updateConfig>[0],
    )
    this.print(config, () => JSON.stringify(config, null, 2))
    // The API returns the pre-write state on this endpoint — run `get-config` for the current value.
    this.warn(`Response reflects state before this update — run \`scopes evaluations get-config ${this.args.id}\` to see the current value.`)
  }
}
