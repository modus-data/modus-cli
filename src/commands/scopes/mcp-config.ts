import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'
import { readJsonBody } from '../../input.js'

export default class ScopesMcpConfig extends BaseCommand<typeof ScopesMcpConfig> {
  static description = "Patch a scope's MCP interface config (core tool exposure, outbound tool exposure)."

  static examples = [
    '<%= config.bin %> scopes mcp-config 42 --body -  <<< \'{"coreTools":{"chat":{"enabled":true}},"mcpToolExposure":{"mode":"all"}}\'',
  ]

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file with the mcp-config fields.' }),
    body: Flags.string({ description: "Read the mcp-config fields as JSON from stdin ('-')." }),
  }

  async run(): Promise<void> {
    if (this.flags.file === undefined && this.flags.body === undefined) {
      // {} is a legitimate no-op patch (both fields are optional) — only reject
      // the case where the user gave no source for a body at all.
      this.error('mcp-config requires --file or --body (may be an empty JSON object).', { exit: 3 })
    }
    const mcpConfig = await readJsonBody({ file: this.flags.file, body: this.flags.body })

    const mgmt = await this.modusManagement()
    await mgmt.scopes.patchMcpConfig(this.args.id, { mcpConfig })
    this.print({ updated: true, id: this.args.id }, () => `Updated MCP config for scope ${this.args.id}.`)
  }
}
