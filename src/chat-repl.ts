/**
 * ponytail: repeated readline/promises `question()` calls don't reliably resolve
 * against non-TTY (piped/redirected) stdin — confirmed against a real staging
 * scope: the second question() call never settles once the pipe has delivered
 * all its data. A real terminal (TTY) doesn't have this problem since input
 * arrives incrementally per keystroke, so that path keeps the interactive
 * question() loop; piped input is read upfront and processed line-by-line
 * instead of looping through question().
 */
export async function runInteractiveChat(
  log: (message: string) => void,
  sendOneShot: (message: string, threadId: string | undefined) => Promise<string | undefined>,
  initialThreadId: string | undefined,
): Promise<void> {
  let threadId = initialThreadId

  if (process.stdin.isTTY) {
    const { createInterface } = await import('node:readline/promises')
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    log('Interactive chat. Ctrl+D or "exit" to quit.')
    try {
      for (;;) {
        let line: string
        try {
          line = await rl.question('> ')
        } catch {
          break // stdin closed (Ctrl+D)
        }
        if (!line.trim() || line.trim() === 'exit') break
        threadId = (await sendOneShot(line, threadId)) ?? threadId
      }
    } finally {
      rl.close()
    }
    return
  }

  // Process each piped line as it arrives rather than buffering the whole
  // stream first — a long-lived producer would otherwise never get a reply,
  // and input memory would be unbounded. Trimmed value is for control flow
  // only; the raw line goes to sendOneShot, matching the TTY branch above.
  const { createInterface } = await import('node:readline')
  const rl = createInterface({ input: process.stdin })
  for await (const rawLine of rl) {
    const line = rawLine.trim()
    if (!line || line === 'exit') break
    threadId = (await sendOneShot(rawLine, threadId)) ?? threadId
  }
}
