import { Args, Flags } from '@oclif/core'
import type { SuggestionEventSource, SuggestionEventType } from '@getmodus/sdk'
import { BaseCommand } from '../../base-command.js'

export default class SuggestionsRecordEvent extends BaseCommand<typeof SuggestionsRecordEvent> {
  static description = 'Record a Home suggestion interaction event (shown, clicked, dismissed, submitted).'

  static examples = ['<%= config.bin %> suggestions record-event sugg_abc --event-type clicked --source home']

  static args = {
    id: Args.string({ description: 'Suggestion id.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    'event-type': Flags.string({
      description: 'Interaction type.',
      options: ['shown', 'clicked', 'dismissed', 'submitted'],
      required: true,
    }),
    source: Flags.string({ description: 'Product surface that emitted the event.', options: ['home'] }),
    'scope-id': Flags.integer({ description: 'Selected Home scope id, when known.' }),
    'thread-id': Flags.string({ description: 'Conversation thread id, when tied to a chat.' }),
  }

  async run(): Promise<void> {
    const client = await this.modusClient()
    await client.suggestions.recordEvent(this.args.id, {
      eventType: this.flags['event-type'] as SuggestionEventType,
      source: this.flags.source as SuggestionEventSource | undefined,
      skillId: this.flags['scope-id'],
      threadId: this.flags['thread-id'],
    })
    this.print({ recorded: true, id: this.args.id }, () => `Recorded event for suggestion ${this.args.id}.`)
  }
}
