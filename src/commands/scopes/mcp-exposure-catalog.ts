import { Args, Flags } from '@oclif/core'
import type { McpExposureCatalogRequest } from '@getmodus/sdk/management'
import { BaseCommand } from '../../base-command.js'
import { readJsonBody } from '../../input.js'

export default class ScopesMcpExposureCatalog extends BaseCommand<typeof ScopesMcpExposureCatalog> {
  static description = 'List the tools a scope can expose to MCP clients. Nothing is saved.'

  static examples = [
    '<%= config.bin %> scopes mcp-exposure-catalog 42',
    '<%= config.bin %> scopes mcp-exposure-catalog 42 --file exposure.json',
  ]

  static args = {
    id: Args.string({ description: 'Scope id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to a JSON file whose fields replace the current draft for this call.' }),
    body: Flags.string({ description: "Read those fields as JSON from stdin ('-')." }),
  }

  async run(): Promise<void> {
    const request = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const mgmt = await this.modusManagement()
    const catalog = await mgmt.scopes.mcpExposureCatalog(this.args.id, request as unknown as McpExposureCatalogRequest)
    this.print(catalog, () => JSON.stringify(catalog, null, 2))
  }
}
