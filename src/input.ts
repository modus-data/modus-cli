import { readFile } from 'node:fs/promises'
import { ValidationError } from '@getmodus/sdk'

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

/** The marker every `--example` fixture and help example uses for a value the user must supply. */
const PLACEHOLDER = /PLACEHOLDER_[A-Z0-9_]+/

/** `path (PLACEHOLDER_X)` for every string in `value` that still holds a placeholder; never the value, which may be sensitive. */
function placeholderPaths(value: unknown, path: string): string[] {
  if (typeof value === 'string') {
    const match = PLACEHOLDER.exec(value)
    return match ? [`${path || '(body)'} (${match[0]})`] : []
  }
  if (Array.isArray(value)) return value.flatMap((item, index) => placeholderPaths(item, `${path}[${index}]`))
  if (value !== null && typeof value === 'object') {
    // A key can be one too: a toolset grant is keyed by its connection id.
    return Object.entries(value).flatMap(([key, item]) => [
      ...placeholderPaths(key, path),
      ...placeholderPaths(item, path ? `${path}.${key}` : key),
    ])
  }
  return []
}

/**
 * Refuses a body that still carries an `--example` placeholder. Sent as-is, the server
 * accepts most of them (a scope deploys active with a selector for a connection that
 * does not exist), or answers with an error that hides the cause.
 */
function rejectPlaceholders(body: Record<string, unknown>, source: string): Record<string, unknown> {
  const found = placeholderPaths(body, '')
  if (found.length > 0) {
    throw new ValidationError(
      `${source} still has example placeholders: ${found.join(', ')}. Replace each PLACEHOLDER_* with a real value from your org, or delete the field.`,
    )
  }
  return body
}

/** Reads the base JSON body for create/update commands from --file or --body - (stdin). */
export async function readJsonBody(options: {
  file?: string
  body?: string
}): Promise<Record<string, unknown>> {
  if (options.file !== undefined && options.body !== undefined) {
    throw new ValidationError('Pass only one of --file or --body.')
  }
  if (options.file !== undefined) {
    const parsed = JSON.parse(await readFile(options.file, 'utf8')) as Record<string, unknown>
    return rejectPlaceholders(parsed, options.file)
  }
  if (options.body === '-') {
    const raw = await readStdin()
    return raw.trim() ? rejectPlaceholders(JSON.parse(raw) as Record<string, unknown>, 'stdin') : {}
  }
  if (options.body !== undefined) {
    // --body only accepts the literal '-' (stdin) — inline JSON on the flag would
    // otherwise be silently dropped here, sending a near-empty body with no error.
    throw new ValidationError(`--body only accepts '-' (read JSON from stdin), got '${options.body}'.`)
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
