import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { readJsonBody } from '../../../input.js'

export default class ContextCustomItemsBatchCreate extends BaseCommand<typeof ContextCustomItemsBatchCreate> {
  static description = 'Create multiple custom context items in one call.'

  static examples = ['<%= config.bin %> context custom-items batch-create --file items.json']

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file containing an array of create bodies.' }),
    body: Flags.string({ description: "Read the JSON array as JSON from stdin ('-')." }),
  }

  async run(): Promise<void> {
    if (!this.flags.file && this.flags.body !== '-') {
      this.error('Pass --file <path> or --body -.', { exit: 3 })
    }
    const parsed = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const inputs = Array.isArray(parsed) ? parsed : (parsed as { items?: unknown[] }).items
    if (!Array.isArray(inputs)) {
      this.error('Input must be a JSON array (or an object with an "items" array).', { exit: 3 })
    }

    const client = await this.modusClient()
    const created = await client.context.customItems.batchCreate(
      inputs as Parameters<typeof client.context.customItems.batchCreate>[0],
    )
    this.print(created, () => JSON.stringify(created, null, 2))
  }
}
