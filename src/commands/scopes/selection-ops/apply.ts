import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../../input.js'

/** The SDK call for a JSON body, or the reason it is rejected. */
export function selectionOpsRequest(body: Record<string, unknown>):
  | { ops: Record<string, unknown>[]; options: { toolset?: Record<string, unknown>; validateOnly?: boolean } }
  | string {
  if (!Array.isArray(body.ops)) return 'ops must be an array (include it via --file/--body).'
  if (body.validateOnly !== undefined && typeof body.validateOnly !== 'boolean') {
    return 'validateOnly must be true or false.'
  }
  return {
    ops: body.ops as Record<string, unknown>[],
    options: {
      ...(body.toolset !== undefined ? { toolset: body.toolset as Record<string, unknown> } : {}),
      ...(body.validateOnly !== undefined ? { validateOnly: body.validateOnly } : {}),
    },
  }
}

export default class ScopesSelectionOpsApply extends BaseCommand<typeof ScopesSelectionOpsApply> {
  static description =
    'Apply selection changes to a scope. The JSON body is { "ops": [{ "op": "setConnectionPreferences", "connectionId": "<uuid>", "preferences": { "schemaVersion": 2, "mode": "all", "include": [], "exclude": [] } }] }. Preview with --validate-only; nothing is written. selectRoot, deselectRoot, and setRootDeepRules are deprecated.'

  static examples = [
    '<%= config.bin %> scopes selection-ops apply 42 --file selection.json',
    '<%= config.bin %> scopes selection-ops apply 42 --validate-only --file selection.json',
  ]

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file with ops and an optional toolset.' }),
    body: Flags.string({ description: "Read ops as JSON from stdin ('-')." }),
    'validate-only': Flags.boolean({
      description: 'Run every check and print the scope that would be saved, without writing it.',
    }),
  }

  async run(): Promise<void> {
    if (this.flags.file === undefined && this.flags.body === undefined) {
      this.error('--file or --body is required.', { exit: 3 })
    }
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, this.flags['validate-only'] ? { validateOnly: true } : {})
    const request = selectionOpsRequest(body)
    if (typeof request === 'string') this.error(request, { exit: 3 })
    const mgmt = await this.modusManagement()
    const scope = await mgmt.scopes.applySelectionOps(this.args.id, request.ops, request.options)
    this.print(scope, () => JSON.stringify(scope, null, 2))
  }
}
