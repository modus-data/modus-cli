import { Args, Flags } from '@oclif/core'
import type { ChatModel, Modus } from '@getmodus/sdk'
import { BaseCommand } from '../../base-command.js'

const DEFAULT_MODEL = 'claude-sonnet-5'

export default class ScopesChat extends BaseCommand<typeof ScopesChat> {
  static description =
    'Chat with a scope. One-shot (streams tokens, then exits) if a message is given; otherwise opens an interactive REPL.'

  static examples = [
    '<%= config.bin %> scopes chat 42 "What changed in revenue last week?"',
    '<%= config.bin %> scopes chat 42',
  ]

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
    message: Args.string({
      description: 'Message to send (quote it). Omit to start an interactive REPL.',
      required: false,
    }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    model: Flags.string({ description: 'Chat model.', default: DEFAULT_MODEL }),
    thread: Flags.string({ description: 'Continue an existing conversation thread id.' }),
    json: Flags.boolean({ description: 'Emit structured SSE-derived events instead of raw streamed text.' }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    if (this.args.message) {
      await this.sendOneShot(client, this.args.id, this.args.message, this.flags.thread)
      return
    }
    await this.repl(client, this.args.id, this.flags.thread)
  }

  private async sendOneShot(
    client: Modus,
    scopeId: string,
    message: string,
    threadId: string | undefined,
  ): Promise<string | undefined> {
    const stream = client.scopes.chatStream(scopeId, message, { model: this.flags.model as ChatModel, threadId })
    let nextThreadId: string | undefined
    if (this.flags.json) {
      for await (const event of stream.eventStream()) {
        this.log(JSON.stringify(event))
        if (event.type === 'done') nextThreadId = event.threadId
      }
    } else {
      for await (const token of stream.textStream()) process.stdout.write(token)
      process.stdout.write('\n')
      nextThreadId = stream.getFinalResult().threadId
    }
    return nextThreadId
  }

  private async repl(client: Modus, scopeId: string, initialThreadId: string | undefined): Promise<void> {
    const { createInterface } = await import('node:readline/promises')
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    let threadId = initialThreadId
    this.log('Interactive chat. Ctrl+D or "exit" to quit.')
    try {
      for (;;) {
        let line: string
        try {
          line = await rl.question('> ')
        } catch {
          break // stdin closed (Ctrl+D)
        }
        if (!line.trim() || line.trim() === 'exit') break
        threadId = (await this.sendOneShot(client, scopeId, line, threadId)) ?? threadId
      }
    } finally {
      rl.close()
    }
  }
}
