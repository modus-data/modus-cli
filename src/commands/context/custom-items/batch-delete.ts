import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ContextCustomItemsBatchDelete extends BaseCommand<
  typeof ContextCustomItemsBatchDelete
> {
  static description =
    'Delete custom context items by source key. Only items you can manage are deleted, and integration-derived items are never affected. By default only the targeted node is removed; use --cascade to also remove everything beneath it. Processes up to 1000 items per call — when the result is truncated, run again.'

  static examples = [
    '<%= config.bin %> context custom-items batch-delete --source-id billing-db',
    '<%= config.bin %> context custom-items batch-delete --source-id billing-db --collection-id contracts --cascade',
    '<%= config.bin %> context custom-items batch-delete --source-id billing-db --collection-id contracts --external-id contract-123',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    'source-id': Flags.string({
      description: 'Customer-defined source to delete from.',
      required: true,
    }),
    'collection-id': Flags.string({
      description: 'Narrow to one collection inside the source.',
    }),
    'external-id': Flags.string({
      description: 'Narrow to one entity inside the collection. Requires --collection-id.',
    }),
    kind: Flags.string({
      description:
        'Which kind to delete at the selected path (non-cascade): disambiguates an entity from its samples at the same path. Defaults to the metadata item at the level.',
      options: ['source', 'collection', 'entity', 'field', 'entity_samples'],
    }),
    cascade: Flags.boolean({
      description: 'Also delete everything beneath the targeted node.',
      default: false,
    }),
    cursor: Flags.string({
      description: 'Continuation cursor from a previous response nextCursor.',
    }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    const result = await client.context.customItems.batchDelete({
      sourceId: this.flags['source-id'],
      collectionId: this.flags['collection-id'],
      externalId: this.flags['external-id'],
      kind: this.flags.kind as Parameters<typeof client.context.customItems.batchDelete>[0]['kind'],
      cascade: this.flags.cascade,
      cursor: this.flags.cursor,
    })
    this.print(
      result,
      () =>
        `Deleted ${result.deletedCount} custom context item(s)` +
        (result.truncated
          ? `. More remain — run again with --cursor ${result.nextCursor}.`
          : '.'),
    )
  }
}
