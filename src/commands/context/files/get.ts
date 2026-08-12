import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ContextFilesGet extends BaseCommand<typeof ContextFilesGet> {
  static description = 'Get a file upload by id.'

  static examples = ['<%= config.bin %> context files get 7a3f9d2c-1111-4000-a000-000000000abc']

  static args = {
    uploadId: Args.string({ description: 'Upload id returned by `upload` / `upload-from-url`.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const file = await mgmt.context.files.get(this.args.uploadId)
    this.print(file, () => JSON.stringify(file, null, 2))
  }
}
