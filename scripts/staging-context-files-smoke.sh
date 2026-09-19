#!/usr/bin/env bash
# Staging smoke for `modus context files upload` + `get`.
# Requires MODUS_API_KEY (and usually MODUS_BASE_URL). Skips cleanly when unset.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
CLI_ROOT="$ROOT/distribution/clients/cli/modus-cli"

if [[ -z "${MODUS_API_KEY:-}" ]]; then
  echo "skip: MODUS_API_KEY not set"
  exit 0
fi

export MODUS_BASE_URL="${MODUS_BASE_URL:-https://api.staging.getmodus.com}"

# Neither package builds on pack (the SDK has no prepack at all), so a clean
# checkout would otherwise ship an empty or stale dist/ in the tarball.
pnpm nx run modus-sdk-typescript:build
pnpm nx run modus-cli:build

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FILE="$TMP/[SDK Staging Smoke]-cli-files-$(date -u +%Y%m%dT%H%M%SZ).txt"
printf 'sdk staging smoke cli context file — safe to leave\n' >"$FILE"

# Exercise the CLI as a user installs it, not as it sits in the repo.
# $CLI_ROOT/bin/run.js is not what ships: in-repo, src/ exists and tsx is a
# devDependency, so oclif resolves every command to TypeScript source that
# bin/run.js registers no loader for. The packed tree carries only dist/, and
# npm sets the bin's executable bit itself — so this gate tests the artifact
# rather than a repo-only arrangement that has never been published.
PACK="$TMP/pack"
mkdir -p "$PACK"
pnpm --filter @getmodus/sdk pack --pack-destination "$PACK"
pnpm --filter @getmodus/cli pack --pack-destination "$PACK"

# Both tarballs are installed together on purpose: the CLI depends on
# "@getmodus/sdk" at the same placeholder version, so installing the local SDK
# alongside it pins the release candidate rather than whatever npm serves.
INSTALL="$TMP/install"
mkdir -p "$INSTALL"
(
  cd "$INSTALL"
  npm init -y >/dev/null
  npm install --no-audit --no-fund "$PACK"/getmodus-sdk-*.tgz "$PACK"/getmodus-cli-*.tgz >/dev/null
)

MODUS_BIN="$INSTALL/node_modules/.bin/modus"
UPLOAD_JSON="$("$MODUS_BIN" context files upload "$FILE")"
echo "$UPLOAD_JSON" | tee "$TMP/upload.json"

UPLOAD_ID="$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); const row=Array.isArray(j)?j[0]:(j.uploaded&&j.uploaded[0])||j; if(!row||!row.uploadId){console.error("no uploadId",j); process.exit(1)}; console.log(row.uploadId)' "$TMP/upload.json")"

GOT_JSON="$("$MODUS_BIN" context files get "$UPLOAD_ID")"
echo "$GOT_JSON" | tee "$TMP/get.json"
node -e 'const want=process.argv[2]; const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); if(!j.uploadId){console.error("get missing uploadId",j); process.exit(1)}; if(j.uploadId!==want){console.error("uploadId mismatch",j.uploadId,want); process.exit(1)}; const ok=["processing","ready"]; if(!ok.includes(j.status)){console.error("bad status",j.status); process.exit(1)}; console.log("ok",j.uploadId,j.status)' "$TMP/get.json" "$UPLOAD_ID"
