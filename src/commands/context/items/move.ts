import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ContextItemsMove extends BaseCommand<typeof ContextItemsMove> {
  static description =
    'Move a live file or Files folder. Pass an empty --destination-folder-uid to move to the Files root. A missing or hidden source is 404; a missing, wrong-type, or cyclic destination is 400; an invisible destination is 403; a sibling name collision is 409. Replace PLACEHOLDER_UID with a real uid from `context items list`.'

  static examples = [
    '<%= config.bin %> context items move PLACEHOLDER_UID --destination-folder-uid PLACEHOLDER_FOLDER_UID',
    '<%= config.bin %> context items move PLACEHOLDER_UID --destination-folder-uid ""',
  ]

  static args = {
    uid: Args.string({ description: 'Stored context-item uid of the file or folder to move.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'destination-folder-uid': Flags.string({
      required: true,
      description:
        'Stored context-item uid of an existing Files folder. Pass an empty value to move to the Files root.',
    }),
  }

  async run(): Promise<void> {
    const destination = this.flags['destination-folder-uid']
    const destinationFolderUid = destination === '' ? null : destination
    const mgmt = await this.modusManagement()
    const result = await mgmt.context.items.move(this.args.uid, { destinationFolderUid })
    this.print(result, () => `Moved ${result.movedItems} item(s).`)
  }
}
