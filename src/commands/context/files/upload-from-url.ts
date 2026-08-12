import { Args, Flags } from '@oclif/core'
import { ValidationError } from '@getmodus/sdk'
import { BaseCommand } from '../../../base-command.js'
import { renderTable } from '../../../output.js'

export default class ContextFilesUploadFromUrl extends BaseCommand<typeof ContextFilesUploadFromUrl> {
  static description =
    'Fetch one or more files from URLs and land them as durable context. Pass --url again for a bulk request (max 100).'

  static examples = [
    '<%= config.bin %> context files upload-from-url https://example.com/report.pdf',
    '<%= config.bin %> context files upload-from-url https://example.com/report.pdf --file-name "Q3 report.pdf"',
    '<%= config.bin %> context files upload-from-url https://a.example.com/1.pdf --url https://a.example.com/2.pdf',
  ]

  static args = {
    url: Args.string({ description: 'Source URL to fetch.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    url: Flags.string({ description: 'Additional source URL (repeatable, for a bulk request).', multiple: true }),
    'file-name': Flags.string({ description: 'Override file name. Single-URL requests only.' }),
  }

  async run(): Promise<void> {
    const urls = [this.args.url, ...(this.flags.url ?? [])]
    const mgmt = await this.modusManagement()

    if (urls.length === 1) {
      const file = await mgmt.context.files.uploadFromUrl(urls[0] as string, { fileName: this.flags['file-name'] })
      this.print(file, () => JSON.stringify(file, null, 2))
      return
    }

    if (this.flags['file-name']) {
      throw new ValidationError('--file-name is only supported for a single URL.')
    }
    const result = await mgmt.context.files.uploadFromUrls(urls.map((url) => ({ url })))
    this.print(result, () => {
      const uploaded = renderTable(result.uploaded as unknown as Array<Record<string, unknown>>, [
        'uploadId',
        'fileName',
        'status',
      ])
      if (result.failed.length === 0) return uploaded
      const failed = renderTable(result.failed as unknown as Array<Record<string, unknown>>, ['index', 'url', 'error'])
      return `${uploaded}\n\nFailed (${result.failed.length}):\n${failed}`
    })
  }
}
