import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Config } from '@oclif/core'
import { describe, expect, it } from 'vitest'
import ContextItemsMove from '../../src/commands/context/items/move.js'

const CLI_ROOT = path.join(fileURLToPath(new URL('../..', import.meta.url)))

async function forwardedMove(argv: string[]): Promise<unknown> {
  let forwarded: unknown
  class Harness extends ContextItemsMove {
    protected override async modusManagement() {
      return {
        context: {
          items: {
            move: async (uid: string, opts: unknown) => {
              forwarded = { uid, opts }
              return { movedItems: 1 }
            },
          },
        },
      } as never
    }
  }
  const config = await Config.load(CLI_ROOT)
  await Harness.run(argv, config)
  return forwarded
}

describe('context items move destination flag', () => {
  it('forwards a folder uid', async () => {
    expect(await forwardedMove(['file-uid', '--destination-folder-uid', 'folder-uid'])).toEqual({
      uid: 'file-uid',
      opts: { destinationFolderUid: 'folder-uid' },
    })
  })

  it('forwards an empty --destination-folder-uid as null (Files root)', async () => {
    expect(await forwardedMove(['file-uid', '--destination-folder-uid='])).toEqual({
      uid: 'file-uid',
      opts: { destinationFolderUid: null },
    })
  })

  it('forwards a quoted empty --destination-folder-uid as null (Files root)', async () => {
    expect(await forwardedMove(['file-uid', '--destination-folder-uid', ''])).toEqual({
      uid: 'file-uid',
      opts: { destinationFolderUid: null },
    })
  })
})
