import { describe, expect, it } from 'vitest'
import { ValidationError } from '@getmodus/sdk'
import { uploadOptionsFromJson } from '../../src/commands/ingested-data/upload.js'

describe('ingested-data upload input', () => {
  it('maps snake_case top-level fields while preserving nested strings exactly', () => {
    const request = {
      type: 'http',
      uri: 'https://example.com/שלום',
      method: 'POST',
      headers: { Empty: '', Whitespace: '  ' },
      body: '',
    }
    const response = { format: 'text', content: 'line 1\r\nשלום\r\n' }

    expect(
      uploadOptionsFromJson({
        integration_type: 'generic',
        request,
        response,
      }),
    ).toEqual({
      integrationType: 'generic',
      request,
      response,
    })
  })

  it.each([
    [{ request: {}, response: {} }, 'integration_type'],
    [{ integration_type: 'generic', response: {} }, 'request'],
    [{ integration_type: 'generic', request: {} }, 'response'],
  ])('rejects a missing top-level field without printing content', (body, field) => {
    expect(() => uploadOptionsFromJson(body)).toThrow(ValidationError)
    expect(() => uploadOptionsFromJson(body)).toThrow(field)
  })
})
