import { Command, Flags, type Interfaces } from '@oclif/core'
import { Modus } from '@getmodus/sdk'
import { ModusManagement } from '@getmodus/sdk/management'
import {
  AuthenticationError,
  ModusError,
  NotFoundError,
  UnprocessableError,
  ValidationError,
} from '@getmodus/sdk'
import { readStoredConfig } from './config.js'

export type CommandFlags<T extends typeof Command> = Interfaces.InferredFlags<T['flags']>
export type CommandArgs<T extends typeof Command> = Interfaces.InferredArgs<T['args']>

function exitCodeForError(error: unknown): number {
  if (error instanceof AuthenticationError) return 2
  if (error instanceof ValidationError || error instanceof UnprocessableError) return 3
  if (error instanceof NotFoundError) return 4
  return 1
}

/** Every command extends this for shared --pretty output, auth resolution, and error mapping. */
export abstract class BaseCommand<T extends typeof Command> extends Command {
  static baseFlags = {
    pretty: Flags.boolean({
      description: 'Human-readable table output instead of the default JSON.',
      default: false,
    }),
  }

  protected flags!: CommandFlags<T>
  protected args!: CommandArgs<T>

  private clientInstance?: Modus
  private managementInstance?: ModusManagement

  public async init(): Promise<void> {
    await super.init()
    const ctor = this.constructor as T & { baseFlags: typeof BaseCommand.baseFlags }
    const { args, flags } = await this.parse({
      flags: ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      args: ctor.args,
      strict: ctor.strict,
    })
    this.flags = flags as CommandFlags<T>
    this.args = args as CommandArgs<T>
  }

  /** Resolution order: MODUS_API_KEY / MODUS_BASE_URL env vars > stored `modus login` config. */
  protected async resolveAuth(): Promise<{ apiKey: string; baseUrl?: string }> {
    const stored = await readStoredConfig()
    const apiKey = process.env.MODUS_API_KEY ?? stored.apiKey
    const baseUrl = process.env.MODUS_BASE_URL ?? stored.baseUrl
    if (!apiKey) {
      throw new AuthenticationError(
        'Not logged in. Run `modus login` or set the MODUS_API_KEY environment variable.',
      )
    }
    return { apiKey, baseUrl }
  }

  protected async modusClient(): Promise<Modus> {
    if (!this.clientInstance) {
      const { apiKey, baseUrl } = await this.resolveAuth()
      this.clientInstance = new Modus({ apiKey, baseUrl })
    }
    return this.clientInstance
  }

  protected async modusManagement(): Promise<ModusManagement> {
    if (!this.managementInstance) {
      const { apiKey, baseUrl } = await this.resolveAuth()
      this.managementInstance = new ModusManagement({ apiKey, baseUrl })
    }
    return this.managementInstance
  }

  /** JSON by default (agent/script-friendly); --pretty renders tables via `render`. */
  protected print(value: unknown, render: () => string): void {
    const pretty = (this.flags as unknown as { pretty: boolean }).pretty
    this.log(pretty ? render() : JSON.stringify(value))
  }

  public async catch(error: unknown): Promise<never> {
    if (error instanceof ModusError) {
      const detail = 'errors' in error && error.errors !== undefined ? ` ${JSON.stringify(error.errors)}` : ''
      this.error(`${error.message}${detail}`, { exit: exitCodeForError(error) })
    }
    throw error
  }
}
