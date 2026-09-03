import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { collectFiles } from '../../src/commands/context/files/upload.js'

describe('collectFiles', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'modus-cli-upload-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('follows a symlinked file passed explicitly, same as a regular file', async () => {
    const real = join(dir, 'real.txt')
    await writeFile(real, 'hello')
    const link = join(dir, 'link.txt')
    await symlink(real, link)

    const files = await collectFiles([real, link], true)

    expect(files.map((file) => file.path).sort()).toEqual([link, real].sort())
  })

  it('follows a symlinked directory passed explicitly and walks its contents', async () => {
    const target = join(dir, 'target')
    await mkdir(target)
    await writeFile(join(target, 'a.txt'), 'a')
    const link = join(dir, 'link-dir')
    await symlink(target, link, 'dir')

    const files = await collectFiles([link], true)

    expect(files).toEqual([{ path: join(link, 'a.txt'), folderPath: 'link-dir' }])
  })

  it('still skips symlinks discovered while walking a directory', async () => {
    const outside = join(dir, 'outside.txt')
    await writeFile(outside, 'x')
    const root = join(dir, 'root')
    await mkdir(root)
    await writeFile(join(root, 'keep.txt'), 'keep')
    await symlink(outside, join(root, 'nested-link.txt'))

    const files = await collectFiles([root], true)

    expect(files).toEqual([{ path: join(root, 'keep.txt'), folderPath: 'root' }])
  })

  it('keeps each supplied directory root in the per-file folder path', async () => {
    const first = join(dir, 'first')
    const second = join(dir, 'second')
    await mkdir(first)
    await mkdir(second)
    await writeFile(join(first, 'a.txt'), 'a')
    await writeFile(join(second, 'b.txt'), 'b')

    const files = await collectFiles([first, second], true)

    expect(files).toEqual([
      { path: join(first, 'a.txt'), folderPath: 'first' },
      { path: join(second, 'b.txt'), folderPath: 'second' },
    ])
  })
})
