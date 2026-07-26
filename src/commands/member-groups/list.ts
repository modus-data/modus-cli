import { BaseCommand } from '../../base-command.js'
import { renderTable } from '../../output.js'

export default class MemberGroupsList extends BaseCommand<typeof MemberGroupsList> {
  static description = "List the organization's member groups."

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const groups = await mgmt.users.listMemberGroups()
    this.print(groups, () => renderTable(groups, ['uid', 'name', 'description']))
  }
}
