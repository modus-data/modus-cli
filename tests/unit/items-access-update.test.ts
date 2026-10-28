import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Config } from '@oclif/core'
import { describe, expect, it } from 'vitest'
import ContextItemsAccessUpdate from '../../src/commands/context/items/access/update.js'

const CLI_ROOT = path.join(fileURLToPath(new URL('../..', import.meta.url)))

describe('context items access update', () => {
  it('forwards the uid and the --file body to updateAccess', async () => {
    const access = {
      visibility: 'private',
      groupPermissions: {},
      sharedWith: [{ email: 'ana@example.com', permission: 'use' }],
    }
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'modus-cli-')), 'access.json')
    writeFileSync(file, JSON.stringify(access))

    let forwarded: unknown
    class Harness extends ContextItemsAccessUpdate {
      protected override async modusManagement() {
        return {
          context: {
            items: {
              updateAccess: async (uid: string, input: unknown) => {
                forwarded = { uid, input }
                return { uid, access: { ...access, ownerUserId: 'user_1' }, canManage: true }
              },
            },
          },
        } as never
      }
    }
    const config = await Config.load(CLI_ROOT)
    await Harness.run(['note-uid', '--file', file], config)

    expect(forwarded).toEqual({ uid: 'note-uid', input: access })
  })
})
