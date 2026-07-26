import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { OPERATIONS } from './operation-coverage.js'

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete'])
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../..')
const SPEC_PATH = resolve(REPO_ROOT, 'apps/services/modus-api/openapi/v1.json')

interface OpenApiSpec {
  paths: Record<string, Record<string, { operationId?: string }>>
}

function operationIds(spec: OpenApiSpec): string[] {
  const ids: string[] = []
  for (const pathItem of Object.values(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (HTTP_METHODS.has(method) && operation?.operationId) ids.push(operation.operationId)
    }
  }
  return ids
}

describe('CLI operation coverage', () => {
  it('accounts for every public operationId in openapi/v1.json, and nothing else', () => {
    const spec = JSON.parse(readFileSync(SPEC_PATH, 'utf8')) as OpenApiSpec
    const specIds = new Set(operationIds(spec))
    const missing = [...specIds].filter((id) => !(id in OPERATIONS))
    const stale = Object.keys(OPERATIONS).filter((id) => !specIds.has(id))
    expect(missing, `Uncovered operations (add to operation-coverage.ts, even as "phase 2 — pending"): ${missing.join(', ')}`).toEqual([])
    expect(stale, `Stale entries in operation-coverage.ts (operationId removed/renamed in the spec): ${stale.join(', ')}`).toEqual([])
  })
})
