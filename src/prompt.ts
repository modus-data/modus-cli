import { createInterface } from 'node:readline'

const ENTER_CODES = new Set([10, 13]) // \n, \r
const CTRL_D = 4
const CTRL_C = 3
const BACKSPACE_CODES = new Set([8, 127]) // \b, DEL

/**
 * ponytail: @oclif/core v4 dropped the old cli-ux `ux.prompt({type:'hide'})` helper.
 * This is the standard raw-mode-stdin recipe for masked input rather than a new dependency.
 */
export async function promptHidden(query: string): Promise<string> {
  const { stdin, stdout } = process

  if (!stdin.isTTY) {
    return new Promise((resolvePromise) => {
      const rl = createInterface({ input: stdin, output: stdout })
      rl.question(`${query}: `, (answer) => {
        rl.close()
        resolvePromise(answer)
      })
    })
  }

  return new Promise((resolvePromise, reject) => {
    stdout.write(`${query}: `)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')

    let value = ''
    let done = false
    const finish = (action: () => void): void => {
      done = true
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener('data', onData)
      action()
    }
    // A single `data` event can carry more than one character (paste, fast typing,
    // or Enter arriving in the same chunk as preceding text) — inspect every
    // character, not just the chunk's first one.
    const onData = (chunk: string): void => {
      for (const char of chunk) {
        if (done) return
        const code = char.charCodeAt(0)
        if (ENTER_CODES.has(code) || code === CTRL_D) {
          finish(() => {
            stdout.write('\n')
            resolvePromise(value)
          })
        } else if (code === CTRL_C) {
          finish(() => reject(new Error('Prompt cancelled.')))
        } else if (BACKSPACE_CODES.has(code)) {
          value = value.slice(0, -1)
        } else {
          value += char
        }
      }
    }
    stdin.on('data', onData)
  })
}
