import { EventEmitter } from 'node:events'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { promptHidden } from '../../src/prompt.js'

function makeFakeStdin(): EventEmitter & {
  isTTY: boolean
  setRawMode: (mode: boolean) => void
  resume: () => void
  pause: () => void
  setEncoding: (encoding: string) => void
  rawModeCalls: boolean[]
} {
  const emitter = new EventEmitter() as EventEmitter & {
    isTTY: boolean
    setRawMode: (mode: boolean) => void
    resume: () => void
    pause: () => void
    setEncoding: (encoding: string) => void
    rawModeCalls: boolean[]
  }
  emitter.isTTY = true
  emitter.rawModeCalls = []
  emitter.setRawMode = (mode: boolean) => emitter.rawModeCalls.push(mode)
  emitter.resume = () => undefined
  emitter.pause = () => undefined
  emitter.setEncoding = () => undefined
  return emitter
}

function makeFakeStdout(): { write: (chunk: string) => boolean; written: string[] } {
  const written: string[] = []
  return { write: (chunk: string) => (written.push(chunk), true), written }
}

describe('promptHidden (raw-mode TTY path)', () => {
  const originalStdin = process.stdin
  const originalStdout = process.stdout

  afterEach(() => {
    Object.defineProperty(process, 'stdin', { value: originalStdin, configurable: true })
    Object.defineProperty(process, 'stdout', { value: originalStdout, configurable: true })
    vi.restoreAllMocks()
  })

  it('processes every character in a multi-character chunk (paste/fast-typing), not just the first', async () => {
    const stdin = makeFakeStdin()
    const stdout = makeFakeStdout()
    Object.defineProperty(process, 'stdin', { value: stdin, configurable: true })
    Object.defineProperty(process, 'stdout', { value: stdout, configurable: true })

    const promise = promptHidden('Password')
    // One chunk carrying several typed characters plus a backspace and Enter,
    // as would arrive from a paste or fast typing rather than one byte at a time.
    stdin.emit('data', 'abc\bd\r')
    const result = await promise

    expect(result).toBe('abd')
    expect(stdin.rawModeCalls).toEqual([true, false])
  })

  it('restores raw mode and exits cleanly on SIGINT instead of leaving the TTY unmasked', async () => {
    const stdin = makeFakeStdin()
    const stdout = makeFakeStdout()
    Object.defineProperty(process, 'stdin', { value: stdin, configurable: true })
    Object.defineProperty(process, 'stdout', { value: stdout, configurable: true })
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((() => undefined) as never))

    // process.exit is mocked to a no-op below (as it must be, to keep the test process
    // alive), so — exactly as in the real exit path — nothing ever settles this promise;
    // assert on observable side effects instead of awaiting it.
    const promise = promptHidden('Password')
    promise.catch(() => undefined)
    process.emit('SIGINT')
    await new Promise((resolve) => setImmediate(resolve))

    expect(stdin.rawModeCalls).toEqual([true, false])
    expect(exitSpy).toHaveBeenCalled()
  })

  it('rejects on a literal Ctrl+C byte and restores raw mode', async () => {
    const stdin = makeFakeStdin()
    const stdout = makeFakeStdout()
    Object.defineProperty(process, 'stdin', { value: stdin, configurable: true })
    Object.defineProperty(process, 'stdout', { value: stdout, configurable: true })

    const promise = promptHidden('Password')
    stdin.emit('data', '')

    await expect(promise).rejects.toThrow('Prompt cancelled.')
    expect(stdin.rawModeCalls).toEqual([true, false])
  })
})
