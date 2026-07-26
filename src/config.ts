import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export interface StoredOAuthSession {
  issuer: string
  clientId: string
  refreshToken: string
  /** Epoch ms. Refreshed transparently by resolveAuth() shortly before this. */
  accessTokenExpiresAt: number
}

export interface StoredConfig {
  /** PAT, or (when `oauth` is set) the current OAuth access token — both are Bearer-usable `modus_*` strings. */
  apiKey?: string
  baseUrl?: string
  oauth?: StoredOAuthSession
}

const CONFIG_DIR_MODE = 0o700
const CONFIG_FILE_MODE = 0o600

// Computed per call, not baked in as a module-load-time constant — so tests
// can mock node:os's homedir() with a plain vi.mock, no vi.resetModules()/
// dynamic re-import dance required to get a fresh path.
function configDir(): string {
  return join(homedir(), '.config', 'modus')
}

function configFile(): string {
  return join(configDir(), 'config.json')
}

export function configFilePath(): string {
  return configFile()
}

// `mode` on mkdir/writeFile only applies when the path is created — chmod
// explicitly so a pre-existing, more permissive dir/file gets tightened too.
// Called on every read as well as every write: a stored PAT left with loose
// permissions by an older CLI build, a restore, or a permissive umask would
// otherwise stay loose forever for a user who only ever reads (env-var auth
// callers included, since resolveAuth() always reads first).
async function tightenConfigPermissions(): Promise<void> {
  await chmod(configDir(), CONFIG_DIR_MODE)
  await chmod(configFile(), CONFIG_FILE_MODE)
}

export async function readStoredConfig(): Promise<StoredConfig> {
  try {
    const raw = await readFile(configFile(), 'utf8')
    await tightenConfigPermissions()
    return JSON.parse(raw) as StoredConfig
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw error
  }
}

export async function writeStoredConfig(config: StoredConfig): Promise<void> {
  await mkdir(configDir(), { recursive: true, mode: CONFIG_DIR_MODE })
  await writeFile(configFile(), `${JSON.stringify(config, null, 2)}\n`, { mode: CONFIG_FILE_MODE })
  await tightenConfigPermissions()
}

export async function clearStoredConfig(): Promise<void> {
  await rm(configFile(), { force: true })
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
