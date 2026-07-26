import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { afterEach, describe, expect, it } from 'vitest'
import { ValidationError } from '@getmodus/sdk'
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
