import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export interface StoredConfig {
  apiKey?: string
  baseUrl?: string
}

const CONFIG_DIR = join(homedir(), '.config', 'modus')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

export function configFilePath(): string {
  return CONFIG_FILE
}

export async function readStoredConfig(): Promise<StoredConfig> {
  try {
    const raw = await readFile(CONFIG_FILE, 'utf8')
    return JSON.parse(raw) as StoredConfig
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw error
  }
}

export async function writeStoredConfig(config: StoredConfig): Promise<void> {
  // `mode` on mkdir/writeFile only applies when the path is created — chmod
  // explicitly so a pre-existing, more permissive dir/file gets tightened too.
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 })
  await chmod(CONFIG_DIR, 0o700)
  await writeFile(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 })
  await chmod(CONFIG_FILE, 0o600)
}

export async function clearStoredConfig(): Promise<void> {
  await rm(CONFIG_FILE, { force: true })
}

const PAT_ORG_UUID_PATTERN = /^modus_([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})_/

/** Org UUID is embedded in the PAT itself (`modus_<orgUuid>_<prefix>_<secret>`) — no API call needed. */
export function parseOrgUuidFromToken(token: string): string | undefined {
  return token.match(PAT_ORG_UUID_PATTERN)?.[1]
}

export function maskToken(token: string): string {
  return token.length > 14 ? `${token.slice(0, 14)}***` : '***'
}
