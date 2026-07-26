import { Args, Flags } from '@oclif/core'
import type { WorkflowActionRequest } from '@getmodus/sdk'
import { BaseCommand } from '../../base-command.js'
import { readJsonBody } from '../../input.js'

export default class WorkflowActionsExecute extends BaseCommand<typeof WorkflowActionsExecute> {
  static description =
    'Execute a single workflow action (tool call) outside a full workflow run, streaming its events.'

  static examples = [
    '<%= config.bin %> workflow-actions execute --session-id sess_1 --file action.json',
  ]

  static args = {
    // ignoreStdin: see chat-repl.ts — oclif otherwise auto-fills this from piped stdin.
    workflowAction: Args.string({
      description: 'Inline workflowAction descriptor JSON (toolId, toolName, ...). Alternative to --file/--body.',
      required: false,
      ignoreStdin: true,
    }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file with the workflowAction descriptor.' }),
    body: Flags.string({ description: "Read the workflowAction descriptor as JSON from stdin ('-')." }),
    'session-id': Flags.string({ description: 'Client-generated session identifier.', required: true }),
    'organization-id': Flags.string({
      description: "Organization the run belongs to. Omit for PAT/SDK callers — falls back to the authenticated principal's org.",
    }),
    'file-thread-id': Flags.string({ description: 'File thread id for document-scoped execution.' }),
    'automation-id': Flags.string({ description: 'Workflow id for usage attribution.' }),
    'user-timezone': Flags.string({ description: 'IANA timezone name for the executing user.' }),
    'run-id': Flags.string({ description: 'Client-supplied run id (Idempotency-Key header wins).' }),
    source: Flags.string({ description: 'UI surface that triggered this action.', options: ['agent', 'api', 'other'] }),
    json: Flags.boolean({ description: 'Emit structured SSE-derived events instead of raw streamed text.' }),
  }

  async run(): Promise<void> {
    let parsed: unknown
    if (this.args.workflowAction) {
      parsed = JSON.parse(this.args.workflowAction)
    } else {
      parsed = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed) || Object.keys(parsed).length === 0) {
      this.error('workflowAction requires an inline arg, --file, or --body (a non-empty JSON object).', { exit: 3 })
    }
    const workflowAction = parsed as Record<string, unknown>

    const client = await this.modusClient()
    const stream = client.workflows.workflowActions.execute({
      organizationId: this.flags['organization-id'],
      sessionId: this.flags['session-id'],
      fileThreadId: this.flags['file-thread-id'],
      workflowAction,
      userTimezone: this.flags['user-timezone'],
      runId: this.flags['run-id'],
      automationId: this.flags['automation-id'],
      source: this.flags.source as WorkflowActionRequest['source'],
    })
    process.stderr.write(`Run started: ${stream.runId}\n`)
    if (this.flags.json) {
      for await (const event of stream) this.log(JSON.stringify(event))
      return
    }
    for await (const event of stream) {
      if (event.type === 'token') process.stdout.write(event.content)
    }
    process.stdout.write('\n')
  }
}
