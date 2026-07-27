import { describe, expect, it } from 'vitest'
import { buildInlineImageEscape, MODUS_LOGO, renderLogoImage, supportsInlineImages } from '../../src/logo.js'

describe('MODUS_LOGO', () => {
  it('renders a multi-line banner with no stray escape artifacts', () => {
    // eslint-disable-next-line no-control-regex
    const plain = MODUS_LOGO.replace(/\x1B\[[0-9;]*m/g, '')
    const lines = plain.split('\n')
    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) {
      expect(line).not.toMatch(/undefined|NaN/)
    }
  })
})

describe('supportsInlineImages', () => {
  it('detects iTerm2 via TERM_PROGRAM', () => {
    expect(supportsInlineImages({ TERM_PROGRAM: 'iTerm.app' })).toBe(true)
  })

  it('detects WezTerm via TERM_PROGRAM', () => {
    expect(supportsInlineImages({ TERM_PROGRAM: 'WezTerm' })).toBe(true)
  })

  it('detects iTerm2 nested in tmux via LC_TERMINAL', () => {
    expect(supportsInlineImages({ TERM_PROGRAM: 'tmux', LC_TERMINAL: 'iTerm2' })).toBe(true)
  })

  it('returns false for unsupported terminals', () => {
    expect(supportsInlineImages({ TERM_PROGRAM: 'Apple_Terminal' })).toBe(false)
    expect(supportsInlineImages({})).toBe(false)
  })
})

describe('buildInlineImageEscape', () => {
  it('wraps the base64 payload in a well-formed OSC 1337 sequence', () => {
    const escape = buildInlineImageEscape('AAAA', 20)
    expect(escape.startsWith('\x1b]1337;File=inline=1;width=20;preserveAspectRatio=1:AAAA')).toBe(true)
    expect(escape.endsWith('\x07')).toBe(true)
  })
})

describe('renderLogoImage', () => {
  it('returns undefined for unsupported terminals', () => {
    expect(renderLogoImage({ TERM_PROGRAM: 'Apple_Terminal' })).toBeUndefined()
  })

  it('returns the escape sequence for supported terminals', () => {
    // eslint-disable-next-line no-control-regex
    expect(renderLogoImage({ TERM_PROGRAM: 'iTerm.app' })).toMatch(/^\x1b]1337;File=inline=1/)
  })
})
