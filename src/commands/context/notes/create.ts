import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ContextNotesCreate extends BaseCommand<typeof ContextNotesCreate> {
  static description = 'Add a freeform note as a context item.'

  static examples = ['<%= config.bin %> context notes create "Q3 pricing" "We raised list price 8% in July."']

  static args = {
    title: Args.string({ description: 'Note title.', required: true }),
    content: Args.string({ description: 'Note body.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const created = await mgmt.context.createNote(this.args.title, this.args.content)
    this.print(created, () => JSON.stringify(created, null, 2))
  }
}
