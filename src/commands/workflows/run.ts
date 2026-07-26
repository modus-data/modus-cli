import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class WorkflowsRun extends BaseCommand<typeof WorkflowsRun> {
  static description =
    'Trigger a workflow run now (ad-hoc), streaming its events. Use --thread to continue an existing run session.'

  static examples = [
    '<%= config.bin %> workflows run 42 "Run the weekly digest now"',
    '<%= config.bin %> workflows run 42',
  ]

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
    // ignoreStdin: see chat-repl.ts — oclif otherwise auto-fills this from piped stdin.
    message: Args.string({
      description: 'Message/input for the run (quote it). Optional — not every workflow needs one.',
      required: false,
      ignoreStdin: true,
    }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    thread: Flags.string({ description: 'Continue an existing run session id.' }),
    version: Flags.string({ description: 'Saved version to run.', options: ['published', 'draft'] }),
    json: Flags.boolean({ description: 'Emit structured SSE-derived events instead of raw streamed text.' }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const stream = client.workflows.runs.create(this.args.id, {
      message: this.args.message ?? '',
      sessionId: this.flags.thread ?? '',
      version: this.flags.version as 'published' | 'draft' | undefined,
    })
    // stderr, not this.log/stdout: --json's stdout must stay pure JSON lines for `| jq`.
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
