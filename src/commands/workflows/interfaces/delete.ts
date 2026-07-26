import { Args } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class WorkflowsInterfacesDelete extends BaseCommand<typeof WorkflowsInterfacesDelete> {
  static description = "Remove one of a workflow's interfaces."

  static args = {
    id: Args.string({ description: 'Workflow id.', required: true }),
    interfaceId: Args.string({ description: 'Interface id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const mgmt = await this.modusManagement()
    await mgmt.workflows.interfaces(this.args.id).delete(this.args.interfaceId)
    this.print({ deleted: true, interfaceId: this.args.interfaceId }, () => `Deleted interface ${this.args.interfaceId}.`)
  }
}
