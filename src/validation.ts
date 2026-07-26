import { ValidationError } from '@getmodus/sdk'

/** Matches the OpenAPI `pageSize` maximum for this endpoint — fail fast, before the network call. */
export function checkPageSize(pageSize: number | undefined, max: number): void {
  if (pageSize === undefined) return
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > max) {
    throw new ValidationError(`--page-size must be an integer between 1 and ${max}, got ${pageSize}.`)
  }
}
