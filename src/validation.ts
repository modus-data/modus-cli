import { ValidationError } from '@getmodus/sdk'

/** Matches the OpenAPI `pageSize` maximum for this endpoint — fail fast, before the network call. */
export function checkPageSize(pageSize: number | undefined, max: number): void {
  if (pageSize === undefined) return
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > max) {
    throw new ValidationError(`--page-size must be an integer between 1 and ${max}, got ${pageSize}.`)
  }
}

/**
 * Parses a comma-separated list of positive integer ids (e.g. a `--scope-ids` flag).
 *
 * Deliberately stricter than `Number()`: each item must match `/^\d+$/` before it is
 * parsed, so hex (`0x10`), exponential (`1e2`), decimal (`1.5`), negative (`-1`), and
 * whitespace-only values are rejected instead of being silently coerced into a
 * different, valid-looking integer.
 */
export function parseIdList(raw: string, flagName: string): number[] {
  return raw.split(',').map((part) => {
    const value = part.trim()
    const id = Number(value)
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id < 1) {
      throw new ValidationError(
        `--${flagName} must be a comma-separated list of integers, got invalid value: "${part}"`,
      )
    }
    return id
  })
}
