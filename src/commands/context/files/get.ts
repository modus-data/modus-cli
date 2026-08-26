import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ContextFilesGet extends BaseCommand<typeof ContextFilesGet> {
  static description =
    'Get a file upload by id. Replace PLACEHOLDER_UPLOAD_ID with the uploadId from `context files upload` or `upload-from-url`.'

  static examples = [
    '<%= config.bin %> context files get PLACEHOLDER_UPLOAD_ID',
    '<%= config.bin %> context files get PLACEHOLDER_UPLOAD_ID --pretty',
  ]

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
