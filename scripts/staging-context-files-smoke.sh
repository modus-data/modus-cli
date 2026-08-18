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

pnpm nx run modus-cli:build

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FILE="$TMP/[SDK Staging Smoke]-cli-files-$(date -u +%Y%m%dT%H%M%SZ).txt"
printf 'sdk staging smoke cli context file — safe to leave\n' >"$FILE"

MODUS_BIN="$CLI_ROOT/bin/run.js"
UPLOAD_JSON="$("$MODUS_BIN" context files upload "$FILE")"
echo "$UPLOAD_JSON" | tee "$TMP/upload.json"

UPLOAD_ID="$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); const row=Array.isArray(j)?j[0]:(j.uploaded&&j.uploaded[0])||j; if(!row||!row.uploadId){console.error("no uploadId",j); process.exit(1)}; console.log(row.uploadId)' "$TMP/upload.json")"

GOT_JSON="$("$MODUS_BIN" context files get "$UPLOAD_ID")"
echo "$GOT_JSON" | tee "$TMP/get.json"
node -e 'const want=process.argv[2]; const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); if(!j.uploadId){console.error("get missing uploadId",j); process.exit(1)}; if(j.uploadId!==want){console.error("uploadId mismatch",j.uploadId,want); process.exit(1)}; const ok=["processing","ready"]; if(!ok.includes(j.status)){console.error("bad status",j.status); process.exit(1)}; console.log("ok",j.uploadId,j.status)' "$TMP/get.json" "$UPLOAD_ID"
