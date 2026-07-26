import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  browserCommandFor,
  buildAuthorizeUrl,
  deriveIssuer,
  discoverMetadata,
  exchangeCode,
  generatePkce,
  generateState,
  refreshTokens,
  registerClient,
  revokeToken,
  startLoopbackServer,
} from '../../src/oauth.js'

describe('browserCommandFor', () => {
  // A URL an attacker (or a misbehaving/compromised AS) could round-trip
  // through the OAuth `resource`/`redirect_uri` params — must never reach a
  // shell that would interpret `&`/`|`/`^` as operators.
  const maliciousUrl = 'https://example.com/?x=1&calc.exe'

  it('never invokes cmd.exe or any other shell on win32', () => {
    const [command, args] = browserCommandFor('win32', maliciousUrl)
    expect(command).toBe('rundll32')
    expect(command).not.toMatch(/cmd/i)
    expect(args).not.toContain('/c')
    expect(args).toContain(maliciousUrl)
  })

  it('uses the plain open/xdg-open executable on darwin/linux, argv-only (no shell)', () => {
    expect(browserCommandFor('darwin', maliciousUrl)).toEqual(['open', [maliciousUrl]])
    expect(browserCommandFor('linux', maliciousUrl)).toEqual(['xdg-open', [maliciousUrl]])
  })
})

describe('deriveIssuer', () => {
  it('swaps the api.* subdomain for app.*, preserving the env segment', () => {
    expect(deriveIssuer('https://api.getmodus.com')).toBe('https://app.getmodus.com')
    expect(deriveIssuer('https://api.staging.getmodus.com')).toBe('https://app.staging.getmodus.com')
  })

  it('returns undefined when the hostname does not start with api.', () => {
    expect(deriveIssuer('http://localhost:3040')).toBeUndefined()
    expect(deriveIssuer('https://modus.example.com')).toBeUndefined()
  })
})

describe('generatePkce', () => {
  it('produces a verifier and its S256 base64url challenge (RFC 7636)', () => {
    const { verifier, challenge } = generatePkce()
    expect(verifier.length).toBeGreaterThanOrEqual(43)
    expect(challenge).toBe(createHash('sha256').update(verifier).digest('base64url'))
  })

  it('generates a fresh verifier every call', () => {
    expect(generatePkce().verifier).not.toBe(generatePkce().verifier)
  })
})

describe('generateState', () => {
  it('generates a non-empty, url-safe, unique value each call', () => {
    const a = generateState()
    const b = generateState()
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/)
  })
})

describe('buildAuthorizeUrl', () => {
  it('encodes all required RFC 8707/PKCE params', () => {
    const scope = ['workflows:read', 'scopes:invoke']
    const url = new URL(
      buildAuthorizeUrl(
        {
          issuer: 'https://app.getmodus.com',
          authorization_endpoint: 'https://app.getmodus.com/oauth/authorize',
          token_endpoint: 'https://app.getmodus.com/oauth/token',
          registration_endpoint: 'https://app.getmodus.com/oauth/register',
          revocation_endpoint: 'https://app.getmodus.com/oauth/revoke',
          scopes_supported: scope,
        },
        {
          clientId: 'dyn_abc',
          redirectUri: 'http://127.0.0.1:51234/callback',
          resource: 'https://api.getmodus.com',
          scope,
          codeChallenge: 'chal123',
          state: 'state123',
        },
      ),
    )
    expect(url.origin + url.pathname).toBe('https://app.getmodus.com/oauth/authorize')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('client_id')).toBe('dyn_abc')
    expect(url.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:51234/callback')
    expect(url.searchParams.get('resource')).toBe('https://api.getmodus.com')
    expect(url.searchParams.get('code_challenge')).toBe('chal123')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('state')).toBe('state123')
    expect(url.searchParams.get('scope')).toBe(scope.join(' '))
  })
})

describe('startLoopbackServer', () => {
  it('binds to 127.0.0.1 on an ephemeral port and resolves the code+state from the redirect', async () => {
    const server = await startLoopbackServer()
    try {
      expect(server.redirectUri).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/callback$/)
      const callbackPromise = server.waitForCallback()
      const res = await fetch(`${server.redirectUri}?code=abc123&state=xyz789&iss=https://app.getmodus.com`)
      expect(res.status).toBe(200)
      await expect(callbackPromise).resolves.toEqual({
        code: 'abc123',
        state: 'xyz789',
        iss: 'https://app.getmodus.com',
      })
    } finally {
      server.close()
    }
  })

  it('rejects waitForCallback when the redirect carries an error param', async () => {
    const server = await startLoopbackServer()
    try {
      // Attach the rejection assertion before triggering it — otherwise the
      // promise can reject before anything is listening, and vitest flags
      // it as an unhandled rejection even though the test itself passes.
      const assertion = expect(server.waitForCallback()).rejects.toThrow(/access_denied/)
      await fetch(`${server.redirectUri}?error=access_denied`)
      await assertion
    } finally {
      server.close()
    }
  })

  it('HTML-escapes the error param before reflecting it into the response body', async () => {
    const server = await startLoopbackServer()
    try {
      const assertion = expect(server.waitForCallback()).rejects.toThrow()
      const res = await fetch(`${server.redirectUri}?${new URLSearchParams({ error: '<script>alert(1)</script>' })}`)
      const body = await res.text()
      expect(body).not.toContain('<script>')
      expect(body).toContain('&lt;script&gt;')
      await assertion
    } finally {
      server.close()
    }
  })
})

describe('fetch-based OAuth calls', () => {
  const metadata = {
    issuer: 'https://app.getmodus.com',
    authorization_endpoint: 'https://app.getmodus.com/oauth/authorize',
    token_endpoint: 'https://app.getmodus.com/oauth/token',
    registration_endpoint: 'https://app.getmodus.com/oauth/register',
    revocation_endpoint: 'https://app.getmodus.com/oauth/revoke',
    scopes_supported: ['workflows:read'],
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('discoverMetadata fetches the well-known AS document', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => metadata } as Response)
    const result = await discoverMetadata('https://app.getmodus.com')
    expect(fetch).toHaveBeenCalledWith('https://app.getmodus.com/.well-known/oauth-authorization-server')
    expect(result).toEqual(metadata)
  })

  it('discoverMetadata throws with the status code on a non-2xx response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 404 } as Response)
    await expect(discoverMetadata('https://app.getmodus.com')).rejects.toThrow(/404/)
  })

  it('registerClient POSTs the DCR request and returns the client_id', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ client_id: 'dyn_abc' }) } as Response)
    const result = await registerClient(metadata, 'http://127.0.0.1:51234/callback', '1.2.3')
    expect(result).toEqual({ clientId: 'dyn_abc' })
    const [url, init] = vi.mocked(fetch).mock.calls[0]!
    expect(url).toBe(metadata.registration_endpoint)
    const body = JSON.parse(init!.body as string)
    expect(body).toMatchObject({
      client_name: 'Modus CLI',
      redirect_uris: ['http://127.0.0.1:51234/callback'],
      token_endpoint_auth_method: 'none',
      software_id: 'com.modus.cli',
      software_version: '1.2.3',
    })
  })

  it('exchangeCode POSTs the authorization_code grant', async () => {
    const tokenResponse = {
      access_token: 'modus_oat_x',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'modus_ort_x',
      scope: 'workflows:read',
    }
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => tokenResponse } as Response)
    const result = await exchangeCode(metadata, {
      code: 'code123',
      codeVerifier: 'verifier123',
      clientId: 'dyn_abc',
      redirectUri: 'http://127.0.0.1:51234/callback',
    })
    expect(result).toEqual(tokenResponse)
    const [url, init] = vi.mocked(fetch).mock.calls[0]!
    expect(url).toBe(metadata.token_endpoint)
    const body = new URLSearchParams(init!.body as string)
    expect(body.get('grant_type')).toBe('authorization_code')
    expect(body.get('code')).toBe('code123')
    expect(body.get('code_verifier')).toBe('verifier123')
  })

  it('refreshTokens POSTs the refresh_token grant', async () => {
    const tokenResponse = {
      access_token: 'modus_oat_y',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'modus_ort_y',
      scope: 'workflows:read',
    }
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => tokenResponse } as Response)
    const result = await refreshTokens(metadata, { refreshToken: 'modus_ort_x', clientId: 'dyn_abc' })
    expect(result).toEqual(tokenResponse)
    const [, init] = vi.mocked(fetch).mock.calls[0]!
    const body = new URLSearchParams(init!.body as string)
    expect(body.get('grant_type')).toBe('refresh_token')
    expect(body.get('refresh_token')).toBe('modus_ort_x')
  })

  it('revokeToken never throws even when the request fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    await expect(
      revokeToken(metadata, { token: 'modus_ort_x', tokenTypeHint: 'refresh_token' }),
    ).resolves.toBeUndefined()
  })
})
