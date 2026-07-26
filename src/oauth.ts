import { createHash, randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import type { Server } from 'node:http'
import { spawn } from 'node:child_process'
import { platform } from 'node:process'
import { ValidationError } from '@getmodus/sdk'

const SOFTWARE_ID = 'com.modus.cli'

export interface AsMetadata {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  registration_endpoint: string
  revocation_endpoint: string
  /**
   * The server's own advertised scope list — request all of it rather than a
   * hardcoded CLI-side copy. The consent/token flow already narrows the
   * grant to `requested ∩ API_SURFACE_SCOPES ∩ userRoleScopes`
   * (apps/services/modus-api/src/oauth/consent/consent.service.ts), so
   * requesting everything the server advertises is exactly "everything this
   * user's role allows" — the same access they already have via the SPA/PAT —
   * with no CLI-side allow-list to fall out of sync as scopes are added.
   */
  scopes_supported: string[]
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
}

/**
 * The OAuth issuer lives on `app.*`, the REST API on `api.*` — same env
 * segment, different subdomain (docs/mcp/oauth.md, packages/config/src/schemas/oauth.ts).
 * Local dev and non-standard deployments don't follow this convention —
 * returns undefined so the caller can require an explicit --issuer.
 */
export function deriveIssuer(baseUrl: string): string | undefined {
  const url = new URL(baseUrl)
  if (!url.hostname.startsWith('api.')) return undefined
  url.hostname = `app.${url.hostname.slice('api.'.length)}`
  return url.origin
}

export async function discoverMetadata(issuer: string): Promise<AsMetadata> {
  const res = await fetch(`${issuer}/.well-known/oauth-authorization-server`)
  if (!res.ok) {
    throw new ValidationError(`OAuth discovery failed at ${issuer} (HTTP ${res.status}).`)
  }
  return (await res.json()) as AsMetadata
}

export async function registerClient(
  metadata: AsMetadata,
  redirectUri: string,
  softwareVersion: string,
): Promise<{ clientId: string }> {
  const res = await fetch(metadata.registration_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'Modus CLI',
      redirect_uris: [redirectUri],
      grant_types: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_method: 'none',
      software_id: SOFTWARE_ID,
      software_version: softwareVersion,
    }),
  })
  if (!res.ok) {
    throw new ValidationError(`OAuth client registration failed (HTTP ${res.status}): ${await res.text()}`)
  }
  const body = (await res.json()) as { client_id: string }
  return { clientId: body.client_id }
}

function base64url(input: Buffer): string {
  return input.toString('base64url')
}

/** RFC 7636 PKCE (S256). */
export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = base64url(randomBytes(32))
  const challenge = base64url(createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

export function generateState(): string {
  return base64url(randomBytes(16))
}

export function buildAuthorizeUrl(
  metadata: AsMetadata,
  params: {
    clientId: string
    redirectUri: string
    resource: string
    scope: readonly string[]
    codeChallenge: string
    state: string
  },
): string {
  const url = new URL(metadata.authorization_endpoint)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', params.clientId)
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('scope', params.scope.join(' '))
  url.searchParams.set('resource', params.resource)
  url.searchParams.set('code_challenge', params.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', params.state)
  return url.toString()
}

export interface CallbackResult {
  code: string
  state: string
  iss?: string
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Starts a loopback HTTP server (RFC 8252 §7.3 — port MAY vary, host must be
 * 127.0.0.1) and resolves with the authorization code once the browser
 * redirects back. Serves a static human-readable page so the browser tab
 * doesn't hang on a blank response even though it never auto-closes (no JS
 * origin to script `window.close()` from, unlike the SPA's own /oauth/complete).
 */
export function startLoopbackServer(): Promise<{
  redirectUri: string
  waitForCallback: () => Promise<CallbackResult>
  close: () => void
}> {
  return new Promise((resolve, reject) => {
    let onCallback: ((result: CallbackResult | { error: Error }) => void) | undefined
    const server: Server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      if (url.pathname !== '/callback') {
        res.writeHead(404).end()
        return
      }
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const error = url.searchParams.get('error')
      res.writeHead(200, { 'Content-Type': 'text/html' })
      if (error) {
        // error is an attacker-influenceable query param (this loopback server is
        // reachable from any local process during the flow) — escape before
        // reflecting it into HTML, never interpolate it raw.
        res.end(
          `<html><body><h1>Modus CLI login failed</h1><p>${escapeHtml(error)}</p><p>You can close this tab.</p></body></html>`,
        )
        onCallback?.({ error: new ValidationError(`OAuth authorization failed: ${error}`) })
        return
      }
      res.end('<html><body><h1>Modus CLI login successful</h1><p>You can close this tab and return to the terminal.</p></body></html>')
      if (code && state) {
        onCallback?.({ code, state, iss: url.searchParams.get('iss') ?? undefined })
      }
    })
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (address === null || typeof address === 'string') {
        reject(new ValidationError('Failed to bind the loopback OAuth callback server.'))
        return
      }
      const redirectUri = `http://127.0.0.1:${address.port}/callback`
      resolve({
        redirectUri,
        waitForCallback: () =>
          new Promise<CallbackResult>((resolveCallback, rejectCallback) => {
            onCallback = (result) => {
              if ('error' in result) rejectCallback(result.error)
              else resolveCallback(result)
            }
          }),
        close: () => server.close(),
      })
    })
  })
}

/**
 * Picks the executable + argv to open `url` in the default browser, given a
 * `NodeJS.Platform`. Pure and platform-parametrized so it's directly
 * testable for all three branches without mocking `node:process`.
 *
 * Never shells out: `cmd /c start <url>` (the naive Windows approach) runs the
 * URL through cmd.exe's own parser, which treats `&`, `|`, `^` etc. as shell
 * operators — a command-injection vector since the URL round-trips through an
 * OAuth `resource`/`redirect_uri` that ends up server-controlled in principle.
 * `rundll32 url.dll,FileProtocolHandler` opens the URL via a direct Win32 API
 * call instead, with no shell in the loop.
 */
export function browserCommandFor(platformName: NodeJS.Platform, url: string): [string, string[]] {
  if (platformName === 'darwin') return ['open', [url]]
  if (platformName === 'win32') return ['rundll32', ['url.dll,FileProtocolHandler', url]]
  return ['xdg-open', [url]]
}

/** Best-effort cross-platform browser open — falls back to printing the URL. */
export function openBrowser(url: string): void {
  try {
    const [command, args] = browserCommandFor(platform, url)
    spawn(command, args, { stdio: 'ignore', detached: true }).unref()
  } catch {
    // Best-effort only — the caller always prints the URL as a fallback.
  }
}

export async function exchangeCode(
  metadata: AsMetadata,
  params: { code: string; codeVerifier: string; clientId: string; redirectUri: string },
): Promise<TokenResponse> {
  const res = await fetch(metadata.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      code_verifier: params.codeVerifier,
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
    }),
  })
  if (!res.ok) {
    throw new ValidationError(`OAuth token exchange failed (HTTP ${res.status}): ${await res.text()}`)
  }
  return (await res.json()) as TokenResponse
}

export async function refreshTokens(
  metadata: AsMetadata,
  params: { refreshToken: string; clientId: string },
): Promise<TokenResponse> {
  const res = await fetch(metadata.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: params.refreshToken,
      client_id: params.clientId,
    }),
  })
  if (!res.ok) {
    throw new ValidationError(`OAuth token refresh failed (HTTP ${res.status}): ${await res.text()}`)
  }
  return (await res.json()) as TokenResponse
}

/** RFC 7009 — best-effort; the endpoint always returns 200 regardless of outcome. */
export async function revokeToken(
  metadata: AsMetadata,
  params: { token: string; tokenTypeHint: 'refresh_token' | 'access_token' },
): Promise<void> {
  await fetch(metadata.revocation_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: params.token, token_type_hint: params.tokenTypeHint }),
  }).catch(() => undefined)
}
