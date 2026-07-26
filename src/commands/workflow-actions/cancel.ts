import { Args } from '@oclif/core'
import { BaseCommand } from '../../base-command.js'

export default class WorkflowActionsCancel extends BaseCommand<typeof WorkflowActionsCancel> {
  static description = 'Cancel an in-flight workflow action run.'

  static args = {
    runId: Args.string({ description: 'Run id.', required: true }),
  }

  static flags = { ...BaseCommand.baseFlags }

  async run(): Promise<void> {
    const client = await this.modusClient()
    await client.workflows.workflowActions.cancel(this.args.runId)
    this.print({ cancelled: true, runId: this.args.runId }, () => `Cancelled run ${this.args.runId}.`)
  }
}
