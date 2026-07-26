import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export interface StoredConfig {
  apiKey?: string
  baseUrl?: string
}

const CONFIG_DIR = join(homedir(), '.config', 'modus')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')
const CONFIG_DIR_MODE = 0o700
const CONFIG_FILE_MODE = 0o600

export function configFilePath(): string {
  return CONFIG_FILE
}

// `mode` on mkdir/writeFile only applies when the path is created — chmod
// explicitly so a pre-existing, more permissive dir/file gets tightened too.
// Called on every read as well as every write: a stored PAT left with loose
// permissions by an older CLI build, a restore, or a permissive umask would
// otherwise stay loose forever for a user who only ever reads (env-var auth
// callers included, since resolveAuth() always reads first).
async function tightenConfigPermissions(): Promise<void> {
  await chmod(CONFIG_DIR, CONFIG_DIR_MODE)
  await chmod(CONFIG_FILE, CONFIG_FILE_MODE)
}

export async function readStoredConfig(): Promise<StoredConfig> {
  try {
    const raw = await readFile(CONFIG_FILE, 'utf8')
    await tightenConfigPermissions()
    return JSON.parse(raw) as StoredConfig
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw error
  }
}

export async function writeStoredConfig(config: StoredConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true, mode: CONFIG_DIR_MODE })
  await writeFile(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`, { mode: CONFIG_FILE_MODE })
  await tightenConfigPermissions()
}

export async function clearStoredConfig(): Promise<void> {
  await rm(CONFIG_FILE, { force: true })
}

// Token format is `modus_<type>_<orgUuid>_<prefix>_<secret>` where type is one of
// pat/oat/ort (packages/access-tokens/src/access-token.ts) — the org UUID is always
// the segment right after the type marker.
const PAT_ORG_UUID_PATTERN =
  /^modus_(?:pat|oat|ort)_([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})_/

/** Org UUID is embedded in the token itself (`modus_<type>_<orgUuid>_<prefix>_<secret>`) — no API call needed. */
export function parseOrgUuidFromToken(token: string): string | undefined {
  return token.match(PAT_ORG_UUID_PATTERN)?.[1]
}

export function maskToken(token: string): string {
  return token.length > 14 ? `${token.slice(0, 14)}***` : '***'
}
