import { Flags } from '@oclif/core'
import { AuthenticationError, Modus } from '@getmodus/sdk'
import { BaseCommand } from '../base-command.js'
import { maskToken, parseOrgUuidFromToken, writeStoredConfig } from '../config.js'
import { MODUS_LOGO } from '../logo.js'
import {
  buildAuthorizeUrl,
  deriveIssuer,
  discoverMetadata,
  exchangeCode,
  generatePkce,
  generateState,
  openBrowser,
  registerClient,
  startLoopbackServer,
} from '../oauth.js'
import { promptHidden } from '../prompt.js'

const DEFAULT_BASE_URL = 'https://api.getmodus.com'

export default class Login extends BaseCommand<typeof Login> {
  static description = 'Authenticate the CLI via OAuth (default, browser-based) or a personal access token (PAT).'

  static examples = [
    '<%= config.bin %> login',
    '<%= config.bin %> login --no-oauth',
    '<%= config.bin %> login --token modus_pat_<orgUuid>_<prefix>_<secret>',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    token: Flags.string({
      description:
        'Personal access token — implies --no-oauth. Prompted (hidden input) if you pass --no-oauth without ' +
        '--token; prefer that, or MODUS_API_KEY, over this flag: a token on the command line is readable ' +
        'from shell history, `ps`, and CI logs.',
    }),
    oauth: Flags.boolean({
      description:
        'Authenticate via OAuth (browser-based). This is the default; pass --no-oauth (or --token) for the ' +
        'PAT flow instead — e.g. in a headless environment with no browser.',
      allowNo: true,
    }),
    issuer: Flags.string({
      description:
        'OAuth authorization server origin. Only needed for non-standard deployments (local dev) — ' +
        "defaults to the api.*→app.* counterpart of --base-url (e.g. api.staging.getmodus.com → app.staging.getmodus.com).",
    }),
    'base-url': Flags.string({
      description: 'Override the API origin (e.g. for staging). Persisted alongside the token.',
    }),
  }

  async run(): Promise<void> {
    const wantsToken = this.flags.token !== undefined || this.flags.oauth === false
    if (wantsToken) return this.runTokenLogin()
    return this.runOAuthLogin()
  }

  private async runTokenLogin(): Promise<void> {
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

  private async runOAuthLogin(): Promise<void> {
    const baseUrl = this.flags['base-url'] ?? DEFAULT_BASE_URL
    const issuer = this.flags.issuer ?? deriveIssuer(baseUrl)
    if (!issuer) {
      this.error(
        `Could not derive the OAuth issuer from ${baseUrl} — pass --issuer explicitly (e.g. --issuer https://app.getmodus.com).`,
        { exit: 3 },
      )
    }

    const metadata = await discoverMetadata(issuer)
    const loopback = await startLoopbackServer()
    try {
      const { clientId } = await registerClient(metadata, loopback.redirectUri, this.config.version)
      const { verifier, challenge } = generatePkce()
      const state = generateState()
      const authorizeUrl = buildAuthorizeUrl(metadata, {
        clientId,
        redirectUri: loopback.redirectUri,
        resource: baseUrl,
        // Request everything the server currently advertises — the consent/token
        // flow narrows this to the user's actual role permissions server-side, so
        // this is "everything this user can already do", not a CLI-chosen subset.
        scope: metadata.scopes_supported,
        codeChallenge: challenge,
        state,
      })

      process.stderr.write(`${MODUS_LOGO}\n\n`)
      process.stderr.write(`Opening your browser to sign in…\nIf it doesn't open, visit:\n${authorizeUrl}\n`)
      openBrowser(authorizeUrl)
      process.stderr.write('Waiting for you to finish signing in in your browser…\n')

      const callback = await loopback.waitForCallback()
      if (callback.state !== state) {
        throw new AuthenticationError('OAuth state mismatch — possible CSRF; login aborted.')
      }
      if (callback.iss !== undefined && callback.iss !== issuer) {
        throw new AuthenticationError(`OAuth issuer mismatch: expected ${issuer}, got ${callback.iss}.`)
      }

      const tokens = await exchangeCode(metadata, {
        code: callback.code,
        codeVerifier: verifier,
        clientId,
        redirectUri: loopback.redirectUri,
      })

      await writeStoredConfig({
        apiKey: tokens.access_token,
        ...(this.flags['base-url'] ? { baseUrl: this.flags['base-url'] } : {}),
        oauth: {
          issuer,
          clientId,
          refreshToken: tokens.refresh_token,
          accessTokenExpiresAt: Date.now() + tokens.expires_in * 1000,
        },
      })

      const orgUuid = parseOrgUuidFromToken(tokens.access_token)
      this.print(
        { loggedIn: true, method: 'oauth', orgUuid: orgUuid ?? null, scopes: tokens.scope },
        () => `Logged in via OAuth (org ${orgUuid ?? 'unknown'}, scopes: ${tokens.scope}).`,
      )
    } finally {
      loopback.close()
    }
  }
}
