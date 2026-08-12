import { stat } from 'node:fs/promises'
import { Args, Flags } from '@oclif/core'
import type { UploadDirResult, WaitUntil } from '@getmodus/sdk/management'
import { BaseCommand } from '../../../base-command.js'
import { renderTable } from '../../../output.js'

const WAIT_UNTIL_OPTIONS = ['processing', 'ready'] as const

function renderUploadDirResult(result: UploadDirResult): string {
  const uploadedTable = renderTable(
    result.uploaded as unknown as Array<Record<string, unknown>>,
    ['uploadId', 'fileName', 'status'],
  )
  if (result.failed.length === 0) return uploadedTable
  const failedTable = renderTable(result.failed as unknown as Array<Record<string, unknown>>, ['path', 'error'])
  return `${uploadedTable}\n\nFailed (${result.failed.length}):\n${failedTable}`
}

export default class ContextFilesUpload extends BaseCommand<typeof ContextFilesUpload> {
  static description =
    'Upload a local file or directory as durable context. Directories upload every file (recursive by default) with bounded concurrency.'

  static examples = [
    '<%= config.bin %> context files upload ./report.pdf',
    '<%= config.bin %> context files upload ./report.pdf --wait-until ready',
    '<%= config.bin %> context files upload ./docs --concurrency 20',
    '<%= config.bin %> context files upload ./docs --no-recursive',
  ]

  static args = {
    path: Args.string({ description: 'Path to a local file or directory.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    recursive: Flags.boolean({
      description: 'Recurse into subdirectories. Directories only.',
      default: true,
      allowNo: true,
    }),
    concurrency: Flags.integer({ description: 'Max concurrent uploads. Directories only.', default: 10 }),
    'wait-until': Flags.string({
      description: 'Wait for the upload to reach this status before returning.',
      options: [...WAIT_UNTIL_OPTIONS],
      default: 'processing',
    }),
  }

  async run(): Promise<void> {
    const waitUntil = this.flags['wait-until'] as WaitUntil
    const mgmt = await this.modusManagement()
    const pathStat = await stat(this.args.path)

    if (pathStat.isDirectory()) {
      const result = await mgmt.context.files.uploadDir(this.args.path, {
        recursive: this.flags.recursive,
        concurrency: this.flags.concurrency,
        waitUntil,
      })
      this.print(result, () => renderUploadDirResult(result))
      return
    }

    const file = await mgmt.context.files.upload(this.args.path, { waitUntil })
    this.print(file, () => JSON.stringify(file, null, 2))
  }
}
