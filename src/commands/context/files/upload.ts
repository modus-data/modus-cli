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
    'Upload local files or directories as durable context. Directories upload every file (recursive by default) with bounded concurrency.'

  static examples = [
    '<%= config.bin %> context files upload ./report.pdf',
    '<%= config.bin %> context files upload ./report.pdf ./notes.txt',
    '<%= config.bin %> context files upload ./docs',
    '<%= config.bin %> context files upload ./docs ./extra.pdf --concurrency 20',
    '<%= config.bin %> context files upload ./report.pdf --wait-until ready',
    '<%= config.bin %> context files upload ./docs --no-recursive',
  ]

  static strict = false

  static args = {
    path: Args.string({ description: 'Paths to local files or directories.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    recursive: Flags.boolean({
      description: 'Recurse into subdirectories. Directories only.',
      default: true,
      allowNo: true,
    }),
    concurrency: Flags.integer({ description: 'Max concurrent uploads.', default: 10 }),
    'wait-until': Flags.string({
      description: 'Wait for the upload to reach this status before returning.',
      options: [...WAIT_UNTIL_OPTIONS],
      default: 'processing',
    }),
  }

  async run(): Promise<void> {
    const waitUntil = this.flags['wait-until'] as WaitUntil
    const { argv } = await this.parse(ContextFilesUpload)
    const paths = argv as string[]
    const mgmt = await this.modusManagement()

    // A single file keeps the original single-resource output; anything else —
    // several files, a directory, or a mix — reports as a batch.
    if (paths.length === 1) {
      const only = paths[0] as string
      const pathStat = await stat(only)
      if (!pathStat.isDirectory()) {
        const file = await mgmt.context.files.upload(only, { waitUntil })
        this.print(file, () => JSON.stringify(file, null, 2))
        return
      }
    }

    const files: string[] = []
    const uploaded: UploadDirResult['uploaded'] = []
    const failed: UploadDirResult['failed'] = []
    for (const path of paths) {
      const pathStat = await stat(path)
      if (pathStat.isDirectory()) {
        // Directories keep their own walk so --recursive still applies to them.
        const result = await mgmt.context.files.uploadDir(path, {
          recursive: this.flags.recursive,
          concurrency: this.flags.concurrency,
          waitUntil,
        })
        uploaded.push(...result.uploaded)
        failed.push(...result.failed)
      } else {
        files.push(path)
      }
    }

    if (files.length > 0) {
      const result = await mgmt.context.files.uploadFiles(files, {
        concurrency: this.flags.concurrency,
        waitUntil,
      })
      uploaded.push(...result.uploaded)
      failed.push(...result.failed)
    }

    const combined: UploadDirResult = { uploaded, failed }
    this.print(combined, () => renderUploadDirResult(combined))
  }
}
