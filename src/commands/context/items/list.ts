import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { pageEnvelope, renderPage } from '../../../output.js'
import { checkPageSize } from '../../../validation.js'

/** Sole empty `--flag=` becomes `[]`; omitted stays undefined. Mixed empty segments stay as-is. */
function emptyableStringArray(values: string[] | undefined): string[] | undefined {
  if (values === undefined) return undefined
  if (values.length === 1 && values[0] === '') return []
  return values
}

export default class ContextItemsList extends BaseCommand<typeof ContextItemsList> {
  static description = 'List organization context items (notes, links, saved queries, and more).'

  static examples = [
    '<%= config.bin %> context items list',
    '<%= config.bin %> context items list --pretty',
    '<%= config.bin %> context items list --context-type note',
    '<%= config.bin %> context items list --connection-id files --parent-uid "" --context-type file_folder_metadata',
    '<%= config.bin %> context items list --connection-id files --parent-uid db-a --parent-uid PUBLIC --context-type file_upload',
    '<%= config.bin %> context items list --connection-id files --ancestor-uid db-a --ancestor-uid PUBLIC',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    'context-type': Flags.string({ description: 'Filter by context type (e.g. note, link, saved_query).' }),
    'parent-uid': Flags.string({
      multiple: true,
      description:
        'Exact ordered native ancestry chain for direct children. Repeat the flag for each UID. Omit for no parent restriction; pass a single empty value for the known-empty root. Use ancestry UIDs plus the last dataPath token — not the hashed context-item uid.',
    }),
    'ancestor-uid': Flags.string({
      multiple: true,
      description:
        'Ordered UID ancestry prefix for strict descendants. Repeat the flag for each UID. Omit for no restriction; pass a single empty value for every item with non-null ancestry.',
    }),
    'connection-id': Flags.string({
      multiple: true,
      description:
        'Restrict to these connection ids. Repeat the flag for more than one. Omit to leave unfiltered; pass a single empty value to match none. The Files root is --connection-id files --parent-uid "".',
    }),
    'page-size': Flags.integer({ description: 'Items per page (default 25, max 200).' }),
    'page-token': Flags.string({ description: 'Opaque page token from a previous response.' }),
  }

  async run(): Promise<void> {
    checkPageSize(this.flags['page-size'], 200)
    const client = await this.modusClient()
    const page = await client.context.items.list({
      contextType: this.flags['context-type'],
      parentUids: emptyableStringArray(this.flags['parent-uid']),
      ancestorUids: emptyableStringArray(this.flags['ancestor-uid']),
      connectionIds: emptyableStringArray(this.flags['connection-id']),
      pageSize: this.flags['page-size'],
      pageToken: this.flags['page-token'],
    })
    this.print(pageEnvelope(page), () => renderPage(page, ['uid', 'contextType', 'description']))
  }
}
