import { BaseCommand } from '../../base-command.js'
import { renderTable } from '../../output.js'

export default class OrgMembersList extends BaseCommand<typeof OrgMembersList> {
  static description = "List the organization's members."

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    const members = await mgmt.users.listOrgMembers()
    this.print(members, () => renderTable(members, ['user_id', 'email', 'role']))
  }
}
