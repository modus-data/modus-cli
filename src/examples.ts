import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

export async function readExampleFixture(name: 'dashboard-full.json' | 'scope-full.json' | 'workflow-full.json'): Promise<string> {
  const path = fileURLToPath(new URL(`../examples/${name}`, import.meta.url))
  return (await readFile(path, 'utf8')).trimEnd()
}
