import { readFile } from 'node:fs/promises'

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

/** Reads the base JSON body for create/update commands from --file or --body - (stdin). */
export async function readJsonBody(options: {
  file?: string
  body?: string
}): Promise<Record<string, unknown>> {
  if (options.file) {
    return JSON.parse(await readFile(options.file, 'utf8')) as Record<string, unknown>
  }
  if (options.body === '-') {
    const raw = await readStdin()
    return raw.trim() ? (JSON.parse(raw) as Record<string, unknown>) : {}
  }
  return {}
}

/** Explicit flags win over matching keys from --file/--body (spec §3). */
export function mergeJsonBody(
  base: Record<string, unknown>,
  overrides: Record<string, unknown | undefined>,
): Record<string, unknown> {
  const merged = { ...base }
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) merged[key] = value
  }
  return merged
}
