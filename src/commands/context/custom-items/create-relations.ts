import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { readJsonBody } from '../../../input.js'

export default class ContextCustomItemsCreateRelations extends BaseCommand<typeof ContextCustomItemsCreateRelations> {
  static description = 'Create or update typed relations between context items.'

  static examples = ['<%= config.bin %> context custom-items create-relations --file relations.json']

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file containing an array of relations.' }),
    body: Flags.string({ description: "Read the JSON array as JSON from stdin ('-')." }),
  }

  async run(): Promise<void> {
    if (!this.flags.file && this.flags.body !== '-') {
      this.error('Pass --file <path> or --body -.', { exit: 3 })
    }
    const parsed = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const relations = Array.isArray(parsed) ? parsed : (parsed as { relations?: unknown[] }).relations
    if (!Array.isArray(relations)) {
      this.error('Input must be a JSON array (or an object with a "relations" array).', { exit: 3 })
    }

    const client = await this.modusClient()
    const upsertedCount = await client.context.customItems.createRelations(
      relations as Parameters<typeof client.context.customItems.createRelations>[0],
    )
    const result = { upsertedCount }
    this.print(result, () => JSON.stringify(result, null, 2))
  }
}
