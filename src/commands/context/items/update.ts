import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../../input.js'

export default class ContextItemsUpdate extends BaseCommand<typeof ContextItemsUpdate> {
  static description = 'Update a context item.'

  static args = {
    uid: Args.string({ description: 'Context item uid.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    description: Flags.string({ description: 'New description.' }),
    'user-feedback': Flags.string({ description: 'Verification verdict.', options: ['negative', 'neutral', 'positive'] }),
    file: Flags.string({ description: 'Path to a JSON file with update fields (e.g. content, topics).' }),
    body: Flags.string({ description: "Read update fields as JSON from stdin ('-')." }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, {
      description: this.flags.description,
      userFeedback: this.flags['user-feedback'],
    })

    const mgmt = await this.modusManagement()
    const item = await mgmt.context.items.update(this.args.uid, body)
    this.print(item, () => JSON.stringify(item, null, 2))
  }
}
