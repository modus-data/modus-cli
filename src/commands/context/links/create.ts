import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../base-command.js'

export default class ContextLinksCreate extends BaseCommand<typeof ContextLinksCreate> {
  static description = 'Add a link as a context item. Modus crawls and indexes it.'

  static args = {
    url: Args.string({ description: 'URL to crawl and index.', required: true }),
  }

  static flags = {
    ...BaseCommand.baseFlags,
    title: Flags.string({ description: 'Display title.' }),
    crawl: Flags.boolean({ description: 'Crawl linked pages under this URL instead of just this page.' }),
    'page-limit': Flags.integer({ description: 'Max pages to crawl when --crawl is set.' }),
  }

  async run(): Promise<void> {
    if (this.flags['page-limit'] !== undefined && !this.flags.crawl) {
      this.error('--page-limit only applies when --crawl is set.', { exit: 3 })
    }
    const mgmt = await this.modusManagement()
    const created = await mgmt.context.createLink(this.args.url, {
      title: this.flags.title,
      isCrawl: this.flags.crawl,
      pageLimit: this.flags['page-limit'],
    })
    this.print(created, () => JSON.stringify(created, null, 2))
  }
}
