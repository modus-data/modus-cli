import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { afterEach, describe, expect, it } from 'vitest'
import { ValidationError } from '@getmodus/sdk'
import { readExampleFixture } from '../../src/examples.js'
import { mergeJsonBody, readJsonBody } from '../../src/input.js'

/** Temporarily swaps process.stdin for a Readable so readJsonBody's stdin path is testable. */
async function withStdin<T>(content: string, fn: () => Promise<T>): Promise<T> {
  const original = process.stdin
  const fake = Readable.from([Buffer.from(content)])
  Object.defineProperty(process, 'stdin', { value: fake, configurable: true })
  try {
    return await fn()
  } finally {
    Object.defineProperty(process, 'stdin', { value: original, configurable: true })
  }
}

describe('readJsonBody', () => {
  const tmpFiles: string[] = []
  afterEach(async () => {
    await Promise.all(tmpFiles.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
  })

  it('returns {} when neither --file nor --body is set', async () => {
    expect(await readJsonBody({})).toEqual({})
  })

  it('reads and parses JSON from --file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'modus-cli-test-'))
    tmpFiles.push(dir)
    const file = join(dir, 'body.json')
    await writeFile(file, JSON.stringify({ name: 'from-file' }))
    expect(await readJsonBody({ file })).toEqual({ name: 'from-file' })
  })

  it('rejects --file and --body together, even with an empty file value', async () => {
    await expect(readJsonBody({ file: '', body: '-' })).rejects.toThrow(
      'Pass only one of --file or --body.',
    )
  })

  it("reads and parses JSON from stdin when --body is '-'", async () => {
    const result = await withStdin(JSON.stringify({ name: 'from-stdin' }), () =>
      readJsonBody({ body: '-' }),
    )
    expect(result).toEqual({ name: 'from-stdin' })
  })

  it("treats empty stdin as {} when --body is '-'", async () => {
    const result = await withStdin('   ', () => readJsonBody({ body: '-' }))
    expect(result).toEqual({})
  })

  it('rejects a --body value other than "-" instead of silently returning {}', async () => {
    await expect(readJsonBody({ body: '{"name":"inline"}' })).rejects.toThrow(ValidationError)
    await expect(readJsonBody({ body: '{"name":"inline"}' })).rejects.toThrow(/only accepts '-'/)
  })
})

describe('readJsonBody placeholder refusal', () => {
  const tmpFiles: string[] = []
  afterEach(async () => {
    await Promise.all(tmpFiles.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
  })

  async function bodyFile(content: string): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'modus-cli-test-'))
    tmpFiles.push(dir)
    const file = join(dir, 'body.json')
    await writeFile(file, content)
    return file
  }

  it('names every placeholder left in a --file body, with its JSON path', async () => {
    const file = await bodyFile(
      JSON.stringify({ toolset: { postgresql: { byConnection: { PLACEHOLDER_CONNECTION_ID: { actions: ['query'] } } } }, ok: 'real', n: 1 }),
    )
    const error = await readJsonBody({ file }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ValidationError)
    expect((error as Error).message).toBe(
      `${file} still has example placeholders: toolset.postgresql.byConnection (PLACEHOLDER_CONNECTION_ID). Replace each PLACEHOLDER_* with a real value from your org, or delete the field.`,
    )
  })

  it('refuses a placeholder piped on stdin', async () => {
    const result = withStdin(JSON.stringify({ elements: [{ elementId: 'PLACEHOLDER_ELEMENT_ID' }] }), () =>
      readJsonBody({ body: '-' }),
    )
    await expect(result).rejects.toThrow(/^stdin still has example placeholders: elements\[0\]\.elementId /)
  })

  it('refuses every shipped --example fixture as printed, and accepts it once the placeholders are replaced', async () => {
    const fixtures = (await readdir(join(import.meta.dirname, '../../examples'))).filter((name) => name.endsWith('.json'))
    expect(fixtures.sort()).toEqual(['dashboard-full.json', 'scope-full.json', 'workflow-full.json'])
    for (const name of fixtures) {
      const printed = await readExampleFixture(name as Parameters<typeof readExampleFixture>[0])
      await expect(readJsonBody({ file: await bodyFile(printed) })).rejects.toThrow(/still has example placeholders/)
      const edited = printed.replace(/PLACEHOLDER_[A-Z0-9_]+/g, 'real-value')
      expect(await readJsonBody({ file: await bodyFile(edited) })).toEqual(JSON.parse(edited))
    }
  })
})

describe('mergeJsonBody', () => {
  it('lets explicit overrides win over matching file keys', () => {
    const merged = mergeJsonBody({ name: 'from-file', model: 'from-file-model' }, { name: 'from-flag' })
    expect(merged).toEqual({ name: 'from-flag', model: 'from-file-model' })
  })

  it('ignores undefined overrides', () => {
    const merged = mergeJsonBody({ name: 'from-file' }, { name: undefined, description: undefined })
    expect(merged).toEqual({ name: 'from-file' })
  })

  it('adds new keys from overrides not present in the file body', () => {
    const merged = mergeJsonBody({}, { name: 'from-flag' })
    expect(merged).toEqual({ name: 'from-flag' })
  })
})
