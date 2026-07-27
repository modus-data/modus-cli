import { createHash, randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import type { Server } from 'node:http'
import { spawn } from 'node:child_process'
import { platform } from 'node:process'
import { ValidationError } from '@getmodus/sdk'
import { MODUS_LOGO_PNG_BASE64 } from './logo.js'

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
 * The callback page's HTML — `detail` must already be HTML-escaped by the
 * caller (it's built from an attacker-influenceable query param).
 */
function renderCallbackPage(opts: { success: boolean; message: string; detail?: string }): string {
  const accent = opts.success ? '#22c55e' : '#ef4444'
  const iconPath = opts.success
    ? '<path d="M7 12.5l3 3 7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
    : '<path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Modus CLI</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #0b0d12;
    color: #e6e8eb;
  }
  @media (prefers-color-scheme: light) {
    body { background: #f5f6f8; color: #14161a; }
  }
  .card {
    text-align: center;
    padding: 2.5rem 3rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.04);
    max-width: 420px;
  }
  @media (prefers-color-scheme: light) {
    .card { background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06); }
  }
  .card img { width: 150px; margin-bottom: 1.75rem; }
  .status { color: ${accent}; margin-bottom: 0.75rem; }
  h1 { font-size: 1.2rem; margin: 0 0 0.5rem; font-weight: 600; }
  p { margin: 0; opacity: 0.65; font-size: 0.95rem; line-height: 1.5; }
  .detail {
    color: ${accent};
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.8rem;
    margin-top: 1rem;
    opacity: 0.9;
    word-break: break-word;
  }
</style>
</head>
<body>
  <div class="card">
    <img src="data:image/png;base64,${MODUS_LOGO_PNG_BASE64}" alt="Modus" />
    <div class="status">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" stroke="currentColor" stroke-width="1.5" opacity="0.3" />
        ${iconPath}
      </svg>
    </div>
    <h1>${opts.message}</h1>
    <p>You can close this tab and return to your terminal.</p>
    ${opts.detail ? `<div class="detail">${opts.detail}</div>` : ''}
  </div>
</body>
</html>`
}

/**
 * Starts a loopback HTTP server (RFC 8252 §7.3 — port MAY vary, host must be
 * 127.0.0.1) and resolves with the authorization code once the browser
 * redirects back. Serves a static human-readable page so the browser tab
 * doesn't hang on a blank response even though it never auto-closes (no JS
 * origin to script `window.close()` from, unlike the SPA's own /oauth/complete).
 */
const CALLBACK_TIMEOUT_MS = 5 * 60 * 1000

export function startLoopbackServer(): Promise<{
  redirectUri: string
  waitForCallback: (timeoutMs?: number) => Promise<CallbackResult>
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
      // Keep-alive is the browser's default for HTTP/1.1 requests — without this
      // header the socket stays open after res.end(), which keeps Node's event
      // loop alive and the CLI process hanging even after everything else is
      // done. server.closeAllConnections() (below) is the belt-and-braces
      // backstop; this header avoids relying on it in the common case.
      res.setHeader('Connection', 'close')
      res.writeHead(200, { 'Content-Type': 'text/html' })
      if (error) {
        // error is an attacker-influenceable query param (this loopback server is
        // reachable from any local process during the flow) — escape before
        // reflecting it into HTML, never interpolate it raw.
        res.end(renderCallbackPage({ success: false, message: 'Sign-in failed', detail: escapeHtml(error) }))
        onCallback?.({ error: new ValidationError(`OAuth authorization failed: ${error}`) })
        return
      }
      res.end(renderCallbackPage({ success: true, message: 'Signed in to Modus' }))
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
        waitForCallback: (timeoutMs = CALLBACK_TIMEOUT_MS) =>
          new Promise<CallbackResult>((resolveCallback, rejectCallback) => {
            const timer = setTimeout(() => {
              rejectCallback(
                new ValidationError(
                  `Timed out waiting for the browser sign-in to complete (${Math.round(timeoutMs / 1000)}s). Run \`modus login\` again.`,
                ),
              )
            }, timeoutMs)
            timer.unref()
            onCallback = (result) => {
              clearTimeout(timer)
              if ('error' in result) rejectCallback(result.error)
              else resolveCallback(result)
            }
          }),
        // server.close() alone only stops accepting *new* connections — an
        // already-open keep-alive socket from the browser's callback request
        // stays open and keeps the process alive indefinitely. Force-close it.
        close: () => {
          server.closeAllConnections()
          server.close()
        },
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
