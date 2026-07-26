import { BaseCommand } from '../base-command.js'
import { clearStoredConfig } from '../config.js'

export default class Logout extends BaseCommand<typeof Logout> {
  static description = 'Remove the stored Modus credential.'

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    await clearStoredConfig()
    this.print({ loggedOut: true }, () => 'Logged out.')
  }
}
