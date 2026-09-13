import { Flags } from '@oclif/core'
import type {
  IngestedDataRequest,
  IngestedDataResponse,
  UploadIngestedDataOptions,
} from '@getmodus/sdk'
import { ValidationError } from '@getmodus/sdk'
import { BaseCommand } from '../../base-command.js'
import { mergeJsonBody, readJsonBody } from '../../input.js'

/** Convert the endpoint's snake_case JSON body to the SDK's public options. */
export function uploadOptionsFromJson(body: Record<string, unknown>): UploadIngestedDataOptions {
  if (typeof body.integration_type !== 'string' || body.integration_type.length === 0) {
    throw new ValidationError('integration_type is required and must be a non-empty string.')
  }
  if (typeof body.request !== 'object' || body.request === null || Array.isArray(body.request)) {
    throw new ValidationError('request is required and must be an object.')
  }
  if (typeof body.response !== 'object' || body.response === null || Array.isArray(body.response)) {
    throw new ValidationError('response is required and must be an object.')
  }
  return {
    integrationType: body.integration_type,
    request: body.request as IngestedDataRequest,
    response: body.response as IngestedDataResponse,
  }
}

export default class IngestedDataUpload extends BaseCommand<typeof IngestedDataUpload> {
  static description =
    'Store an exact integration request and response as immutable ingested data. An identical retry returns Conflict because it is already stored.'

  static examples = [
    '<%= config.bin %> ingested-data upload --file ingested-data.json',
    'printf %s \'{"integration_type":"generic","request":{"type":"sql","query":"SELECT 1"},"response":{"format":"csv","content":"value\\n1\\n"}}\' | <%= config.bin %> ingested-data upload --body -',
  ]

  static flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({ description: 'Path to the complete ingested-data JSON body.' }),
    body: Flags.string({ description: "Read the complete ingested-data JSON body from stdin ('-')." }),
    'integration-type': Flags.string({
      description: 'Canonical integration identifier; overrides integration_type in the JSON body.',
    }),
  }

  async run(): Promise<void> {
    const fileBody = await readJsonBody({ file: this.flags.file, body: this.flags.body })
    const body = mergeJsonBody(fileBody, {
      integration_type: this.flags['integration-type'],
    })
    const options = uploadOptionsFromJson(body)
    const client = await this.modusClient()
    const created = await client.ingestedData.upload(options)
    this.print(created, () => created.checksum)
  }
}
