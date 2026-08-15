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

    expect(files.sort()).toEqual([link, real].sort())
  })

  it('follows a symlinked directory passed explicitly and walks its contents', async () => {
    const target = join(dir, 'target')
    await mkdir(target)
    await writeFile(join(target, 'a.txt'), 'a')
    const link = join(dir, 'link-dir')
    await symlink(target, link, 'dir')

    const files = await collectFiles([link], true)

    expect(files).toEqual([join(link, 'a.txt')])
  })

  it('still skips symlinks discovered while walking a directory', async () => {
    const outside = join(dir, 'outside.txt')
    await writeFile(outside, 'x')
    const root = join(dir, 'root')
    await mkdir(root)
    await writeFile(join(root, 'keep.txt'), 'keep')
    await symlink(outside, join(root, 'nested-link.txt'))

    const files = await collectFiles([root], true)

    expect(files).toEqual([join(root, 'keep.txt')])
  })
})
