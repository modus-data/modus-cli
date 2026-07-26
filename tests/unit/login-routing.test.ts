import { describe, expect, it, vi } from 'vitest'
import Login from '../../src/commands/login.js'

// Only the flag → OAuth-vs-PAT routing decision, not the full flows (already
// covered by oauth.test.ts/resolve-auth.test.ts and the live staging run) —
// getting this branch wrong would silently always pick one flow regardless
// of what the user asked for.
function makeLogin(flags: { token?: string; oauth?: boolean }): Login {
  const command = Object.create(Login.prototype) as Login
  ;(command as unknown as { flags: typeof flags }).flags = flags
  return command
}

describe('Login.run routing', () => {
  it('defaults to OAuth when no flags are given', async () => {
    const command = makeLogin({})
    const runOAuthLogin = vi.spyOn(command as never, 'runOAuthLogin').mockResolvedValue(undefined)
    const runTokenLogin = vi.spyOn(command as never, 'runTokenLogin').mockResolvedValue(undefined)
    await command.run()
    expect(runOAuthLogin).toHaveBeenCalledTimes(1)
    expect(runTokenLogin).not.toHaveBeenCalled()
  })

  it('uses the PAT flow when --token is given', async () => {
    const command = makeLogin({ token: 'modus_pat_x' })
    const runOAuthLogin = vi.spyOn(command as never, 'runOAuthLogin').mockResolvedValue(undefined)
    const runTokenLogin = vi.spyOn(command as never, 'runTokenLogin').mockResolvedValue(undefined)
    await command.run()
    expect(runTokenLogin).toHaveBeenCalledTimes(1)
    expect(runOAuthLogin).not.toHaveBeenCalled()
  })

  it('uses the PAT flow when --no-oauth is given, even without --token', async () => {
    const command = makeLogin({ oauth: false })
    const runOAuthLogin = vi.spyOn(command as never, 'runOAuthLogin').mockResolvedValue(undefined)
    const runTokenLogin = vi.spyOn(command as never, 'runTokenLogin').mockResolvedValue(undefined)
    await command.run()
    expect(runTokenLogin).toHaveBeenCalledTimes(1)
    expect(runOAuthLogin).not.toHaveBeenCalled()
  })

  it('uses the OAuth flow when --oauth is explicitly given', async () => {
    const command = makeLogin({ oauth: true })
    const runOAuthLogin = vi.spyOn(command as never, 'runOAuthLogin').mockResolvedValue(undefined)
    const runTokenLogin = vi.spyOn(command as never, 'runTokenLogin').mockResolvedValue(undefined)
    await command.run()
    expect(runOAuthLogin).toHaveBeenCalledTimes(1)
    expect(runTokenLogin).not.toHaveBeenCalled()
  })
})
