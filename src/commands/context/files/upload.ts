import { readdir, stat } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { Args, Flags } from '@oclif/core'
import type { UploadDirResult, UploadFileInput, UploadProgress, WaitUntil } from '@getmodus/sdk/management'
import { BaseCommand } from '../../../base-command.js'
import { renderTable } from '../../../output.js'
import {
  createProgressThrottleState,
  formatProgressLine,
  markProgressReported,
  shouldReportProgress,
} from '../../../upload-progress.js'

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

/** Same skip rules as the SDK walk: no hidden names, no symlink follow. */
export async function walkFiles(root: string, recursive: boolean): Promise<string[]> {
  const out: string[] = []
  const entries = await readdir(root, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const full = join(root, entry.name)
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory()) {
      if (recursive) out.push(...(await walkFiles(full, true)))
      continue
    }
    if (entry.isFile()) out.push(full)
  }
  return out
}

/** Follows symlinks on explicitly-named paths, same as the pre-batch single-file
 * branch below and the SDK's own `uploadDir` root handling — only entries
 * *discovered* by walking a directory (see `walkFiles`) skip symlinks. */
export async function collectFiles(paths: readonly string[], recursive: boolean): Promise<UploadFileInput[]> {
  const files: UploadFileInput[] = []
  for (const path of paths) {
    const pathStat = await stat(path)
    if (pathStat.isDirectory()) {
      for (const file of await walkFiles(path, recursive)) {
        // Relative to each explicitly requested root's parent so multi-root
        // uploads retain the root directory as well as nested folders.
        const folderPath = relative(dirname(path), dirname(file)).replace(/\\/g, '/')
        files.push({ path: file, ...(folderPath.length > 0 ? { folderPath } : {}) })
      }
    } else files.push({ path })
  }
  return files
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
    // several files, a directory, or a mix — reports as a batch with progress.
    if (paths.length === 1) {
      const only = paths[0] as string
      const pathStat = await stat(only)
      if (!pathStat.isDirectory()) {
        const file = await mgmt.context.files.upload(only, { waitUntil })
        this.print(file, () => JSON.stringify(file, null, 2))
        return
      }
    }

    const files = await collectFiles(paths, this.flags.recursive)
    process.stderr.write(`Found ${files.length} files to upload.\n`)
    if (files.length === 0) {
      this.print({ uploaded: [], failed: [] }, () => 'No files to upload.')
      return
    }

    const startedAt = Date.now()
    const throttle = createProgressThrottleState(startedAt)
    let last: UploadProgress = { completed: 0, total: files.length, succeeded: 0, failed: 0 }
    const onProgress = (event: UploadProgress) => {
      last = event
      const elapsed = Date.now() - startedAt
      if (event.completed >= event.total) {
        process.stderr.write(`${formatProgressLine(event, elapsed)}\n`)
        return
      }
      if (!shouldReportProgress(event, throttle)) return
      process.stderr.write(`${formatProgressLine(event, elapsed)}\n`)
      markProgressReported(event, throttle)
    }
    // Time-based heartbeat so long PUT/finalize batches still report on stderr
    // even when the SDK has not emitted a new file outcome yet.
    const heartbeat = setInterval(() => {
      if (last.completed >= last.total) return
      const elapsed = Date.now() - startedAt
      process.stderr.write(`${formatProgressLine(last, elapsed)}\n`)
      markProgressReported(last, throttle)
    }, 30_000)

    try {
      const result = await mgmt.context.files.uploadFiles(files, {
        concurrency: this.flags.concurrency,
        waitUntil,
        onProgress,
      })

      this.print(result, () => renderUploadDirResult(result))
      if (result.failed.length > 0) this.exit(1)
    } finally {
      clearInterval(heartbeat)
    }
  }
}
