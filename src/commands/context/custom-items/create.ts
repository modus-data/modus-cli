import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../../input.js'

export default class ContextCustomItemsCreate extends BaseCommand<typeof ContextCustomItemsCreate> {
  static description =
    'Create a custom context item. Opaque fields (content, attributes, value, samples, raw) require --file/--body.'

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file with the full create body.' }),
    body: Flags.string({ description: "Read the full create body as JSON from stdin ('-')." }),
    kind: Flags.string({
      description: 'Custom item kind.',
      options: ['source', 'collection', 'entity', 'field', 'entity_samples'],
    }),
    'source-id': Flags.string({ description: 'Source id this item belongs to.' }),
    'source-name': Flags.string({ description: 'Source display name.' }),
    name: Flags.string({ description: 'Display name.' }),
    description: Flags.string({ description: 'Description.' }),
    'external-id': Flags.string({ description: 'External id in the source system.' }),
    'field-name': Flags.string({ description: 'Field name (kind=field).' }),
    'entity-type': Flags.string({ description: 'Entity type (kind=entity).' }),
    url: Flags.string({ description: 'Source URL.' }),
    topic: Flags.string({ description: 'Topic tag (repeatable).', multiple: true }),
    'idempotency-key': Flags.string({ description: 'Idempotency key for safe retries.' }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, {
      kind: this.flags.kind,
      sourceId: this.flags['source-id'],
      sourceName: this.flags['source-name'],
      name: this.flags.name,
      description: this.flags.description,
      externalId: this.flags['external-id'],
      fieldName: this.flags['field-name'],
      entityType: this.flags['entity-type'],
      url: this.flags.url,
      topics: this.flags.topic,
      idempotencyKey: this.flags['idempotency-key'],
    })

    if (!body.kind || !body.sourceId) {
      this.error('--kind and --source-id are required (or include them via --file/--body).', { exit: 3 })
    }

    const client = await this.modusClient()
    const created = await client.context.customItems.create(
      body as unknown as Parameters<typeof client.context.customItems.create>[0],
    )
    this.print(created, () => JSON.stringify(created, null, 2))
  }
}
