import { Args, Flags } from '@oclif/core'
import type { UpdateContextItemAccessInput } from '@getmodus/sdk/management'
import { BaseCommand } from '../../../../base-command.js'
import { readJsonBody } from '../../../../input.js'

export default class ContextItemsAccessUpdate extends BaseCommand<typeof ContextItemsAccessUpdate> {
  static description =
    'Replace who can view and manage a note, saved query, link or uploaded file. The body ({ visibility, groupPermissions, sharedWith }) comes from --file or --body -; all three settings replace the current ones.'

  static examples = [
    '<%= config.bin %> context items access update PLACEHOLDER_UID --file access.json',
    'echo \'{"visibility":"private","groupPermissions":{},"sharedWith":[{"email":"ana@example.com","permission":"use"}]}\' | <%= config.bin %> context items access update PLACEHOLDER_UID --body -',
  ]

  static args = {
    uid: Args.string({ description: 'UUID of the context item.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file with the full access body.', exactlyOne: ['file', 'body'] }),
    body: Flags.string({ description: "Read the full access body as JSON from stdin ('-').", exactlyOne: ['file', 'body'] }),
  }

  async run(): Promise<void> {
    const body = await readJsonBody({ file: this.flags.file, body: this.flags.body })

    const mgmt = await this.modusManagement()
    const result = await mgmt.context.items.updateAccess(
      this.args.uid,
      body as unknown as UpdateContextItemAccessInput,
    )
    this.print(result, () => JSON.stringify(result, null, 2))
  }
}
