import { Flags } from '@oclif/core'
import { AuthenticationError, Modus } from '@getmodus/sdk'
import { BaseCommand } from '../base-command.js'
import { maskToken, parseOrgUuidFromToken, writeStoredConfig } from '../config.js'
import { promptHidden } from '../prompt.js'

export default class Login extends BaseCommand<typeof Login> {
  static description = 'Authenticate the CLI with a Modus personal access token (PAT).'

  static examples = [
    '<%= config.bin %> login',
    '<%= config.bin %> login --token modus_pat_<orgUuid>_<prefix>_<secret>',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    token: Flags.string({
      description:
        'Personal access token. Prompted (hidden input) if omitted — prefer that, or MODUS_API_KEY, ' +
        'over this flag: a token on the command line is readable from shell history, `ps`, and CI logs.',
    }),
    'base-url': Flags.string({
      description: 'Override the API origin (e.g. for staging). Persisted alongside the token.',
    }),
  }

  async run(): Promise<void> {
    if (this.flags.token) {
      this.warn('--token is visible in shell history and process listings. Prefer the interactive prompt or MODUS_API_KEY.')
    }
    const token = this.flags.token ?? (await promptHidden('Modus API token'))
    if (!token.startsWith('modus_')) {
      throw new AuthenticationError("Invalid token format. Modus tokens start with 'modus_'.")
    }

    const client = new Modus({ apiKey: token, baseUrl: this.flags['base-url'] })
    await client.scopes.list({ pageSize: 1 })

    await writeStoredConfig({
      apiKey: token,
      ...(this.flags['base-url'] ? { baseUrl: this.flags['base-url'] } : {}),
    })

    const orgUuid = parseOrgUuidFromToken(token)
    this.print(
      { loggedIn: true, orgUuid: orgUuid ?? null, token: maskToken(token) },
      () => `Logged in (org ${orgUuid ?? 'unknown'}, token ${maskToken(token)}).`,
    )
  }
}
