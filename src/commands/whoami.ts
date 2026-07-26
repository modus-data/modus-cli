import { BaseCommand } from '../base-command.js'
import { maskToken, parseOrgUuidFromToken } from '../config.js'

export default class Whoami extends BaseCommand<typeof Whoami> {
  static description =
    'Show the org and token resolved from the active credential (no API call — no /me endpoint exists).'

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const { apiKey, baseUrl } = await this.resolveAuth()
    const orgUuid = parseOrgUuidFromToken(apiKey)
    const result = {
      orgUuid: orgUuid ?? null,
      token: maskToken(apiKey),
      baseUrl: baseUrl ?? 'https://api.getmodus.com',
    }
    this.print(result, () =>
      [`org:      ${result.orgUuid ?? '(unknown — unexpected token format)'}`,
        `token:    ${result.token}`,
        `base url: ${result.baseUrl}`].join('\n'),
    )
  }
}
