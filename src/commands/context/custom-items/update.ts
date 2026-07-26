import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../../input.js'

export default class ContextCustomItemsUpdate extends BaseCommand<typeof ContextCustomItemsUpdate> {
  static description = 'Update a custom context item.'

  static args = {
    uid: Args.string({ description: 'Custom context item uid.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({ description: 'Display name.' }),
    description: Flags.string({ description: 'Description.' }),
    'entity-type': Flags.string({ description: 'Entity type (kind=entity).' }),
    url: Flags.string({ description: 'Source URL.' }),
    topic: Flags.string({ description: 'Topic tag (repeatable, replaces the full set).', multiple: true }),
    file: Flags.string({ description: 'Path to a JSON file with update fields (e.g. content, attributes).' }),
    body: Flags.string({ description: "Read update fields as JSON from stdin ('-')." }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, {
      name: this.flags.name,
      description: this.flags.description,
      entityType: this.flags['entity-type'],
      url: this.flags.url,
      topics: this.flags.topic,
    })

    const client = await this.modusClient()
    const result = await client.context.customItems.update(
      this.args.uid,
      body as Parameters<typeof client.context.customItems.update>[1],
    )
    this.print(result, () => JSON.stringify(result, null, 2))
  }
}
