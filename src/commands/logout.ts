import { BaseCommand } from '../base-command.js'
import { clearStoredConfig, readStoredConfig } from '../config.js'
import { discoverMetadata, revokeToken } from '../oauth.js'

export default class Logout extends BaseCommand<typeof Logout> {
  static description = 'Remove the stored Modus credential (revoking the grant server-side for OAuth sessions).'

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const stored = await readStoredConfig()
    if (stored.oauth) {
      // Best-effort: revoking the refresh token invalidates the whole grant
      // chain server-side (RFC 7009 §2.1). Never block logout on this.
      await discoverMetadata(stored.oauth.issuer)
        .then((metadata) =>
          revokeToken(metadata, { token: stored.oauth!.refreshToken, tokenTypeHint: 'refresh_token' }),
        )
        .catch(() => undefined)
    }
    await clearStoredConfig()
    this.print({ loggedOut: true }, () => 'Logged out.')
  }
}
