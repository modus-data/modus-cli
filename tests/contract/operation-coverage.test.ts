import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete'])
const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(TEST_DIR, '../../../../../..')
const COMMANDS_DIR = resolve(TEST_DIR, '../../src/commands')
const SURFACE_PATH = resolve(REPO_ROOT, 'distribution/clients/sdk-surface.json')
// Two independent public services, two independent specs — chat/run streaming
// (agent-service) was missed entirely in the CLI's first pass because only
// modus-api's spec was ever audited. Both must be checked here.
const SPEC_PATHS = [
  resolve(REPO_ROOT, 'apps/services/modus-api/openapi/v1.json'),
  resolve(REPO_ROOT, 'apps/services/agent-service/openapi/v1.json'),
]

interface OpenApiSpec {
  paths: Record<string, Record<string, { operationId?: string }>>
}

interface SdkSurface {
  operations: Record<string, { mode: string; cli?: string; ticket?: string }>
}

const surface = JSON.parse(readFileSync(SURFACE_PATH, 'utf8')) as SdkSurface

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
  it('accounts for every public operationId in both public specs (modus-api + agent-service), and nothing else', () => {
    const specIds = new Set(
      SPEC_PATHS.flatMap((path) => operationIds(JSON.parse(readFileSync(path, 'utf8')) as OpenApiSpec)),
    )
    const missing = [...specIds].filter((id) => !(id in surface.operations))
    const stale = Object.keys(surface.operations).filter((id) => !specIds.has(id))
    expect(
      missing,
      `Uncovered operations (add to distribution/clients/sdk-surface.json): ${missing.join(', ')}`,
    ).toEqual([])
    expect(
      stale,
      `Stale entries in sdk-surface.json (operationId removed/renamed in the spec): ${stale.join(', ')}`,
    ).toEqual([])
  })

  it('requires every excluded entry to cite a CU ticket', () => {
    const badExclusions = Object.entries(surface.operations)
      .filter(([, entry]) => entry.mode === 'excluded')
      .filter(([, entry]) => !/^CU-\w+$/.test(entry.ticket ?? ''))
      .map(([id]) => id)
    expect(badExclusions, `Excluded entries missing a well-formed CU-XXXXXXXXX ticket: ${badExclusions.join(', ')}`).toEqual([])
  })

  it('backs every cli command id with a command file', () => {
    const missing = Object.entries(surface.operations)
      .filter(([, entry]) => entry.cli)
      .filter(([, entry]) => !existsSync(join(COMMANDS_DIR, `${entry.cli!.split(' ').join('/')}.ts`)))
      .map(([id, entry]) => `${id} (${entry.cli})`)
    expect(missing, `cli command ids with no src/commands file: ${missing.join(', ')}`).toEqual([])
  })
})
