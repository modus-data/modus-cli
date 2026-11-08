#!/usr/bin/env bash
# Staging smoke for the installed CLI: `modus context files upload` + `get`, then the CLI
# parity journey (J9): chat, runs interrupt/edit-queued/resume, id errors with request
# counts, and JSON output that parses.
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
printf 'sdk staging smoke cli context file — deleted by the next SDK smoke run\n' >"$FILE"

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

# ── J9: CLI parity ──────────────────────────────────────────────────────────────
# Every check runs; the script fails at the end if any did. A preload counts the requests
# each command sends (the CLI has no hook of its own), so "sent once" and "sent nothing"
# are asserted, not assumed.
MODEL=gpt-oss-20b # the cheapest model the run policy admits
cat >"$TMP/count-requests.cjs" <<'JS'
const { appendFileSync } = require('node:fs')
const real = globalThis.fetch
globalThis.fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  appendFileSync(process.env.MODUS_SMOKE_REQUEST_LOG, `${init?.method ?? 'GET'} ${url}\n`)
  return real(input, init)
}
JS
FAILED=0
check() { # label condition...
  local label="$1"
  shift
  if "$@"; then echo "ok   $label"; else echo "FAIL $label (exit=$RC requests=$REQS) $(head -c 400 "$TMP/err")" >&2; FAILED=1; fi
}
cli() { # runs the installed CLI; sets RC and REQS, output in $TMP/out and $TMP/err
  : >"$TMP/requests.log"
  set +e
  NODE_OPTIONS="--require $TMP/count-requests.cjs" MODUS_SMOKE_REQUEST_LOG="$TMP/requests.log" \
    "$MODUS_BIN" "$@" >"$TMP/out" 2>"$TMP/err"
  RC=$?
  set -e
  REQS=$(wc -l <"$TMP/requests.log" | tr -d ' ')
}
json_lines_parse() { node -e 'const t=require("fs").readFileSync(process.argv[1],"utf8").trim(); if(!t) process.exit(1); for (const l of t.split("\n")) JSON.parse(l)' "$TMP/out"; }
exit0_and_json_parses() { test "$RC" = 0 && json_lines_parse; }
out_has() { grep -qi -- "$1" "$TMP/out"; }
done_field() { node -e 'const ev=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse).find((e)=>e.type==="done"); console.log(String(ev?.[process.argv[2]] ?? ""))' "$TMP/out" "$1"; }

cli scopes get 2147483648
check "scopes get 2147483648: exit 4 (NotFound), message on stderr, 1 request" \
  test "$RC" = 4 -a "$REQS" = 1 -a -n "$(grep -i 'No resource has id 2147483648' "$TMP/err")"
cli scopes get ..
check "scopes get ..: exit 3 (ValidationError), 0 requests" test "$RC" = 3 -a "$REQS" = 0
cli scopes get revenue-analysis
check "scopes get <slug>: exit 1 (BadRequestError), 1 request" test "$RC" = 1 -a "$REQS" = 1
MODUS_API_KEY=modus_00000000_dead_beef_invalid_key_for_smoke cli scopes list --page-size 1
check "a bad key: exit 2 (AuthenticationError), 1 request" test "$RC" = 2 -a "$REQS" = 1
cli scopes list --page-size 1
FIRST_SCOPE="$(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); const s=(j.items??j.scopes??j)[0]; console.log(String(s?.id ?? ""))' "$TMP/out" 2>/dev/null || true)"
if [[ -n "$FIRST_SCOPE" ]]; then
  cli scopes get "$FIRST_SCOPE"
  check "positive control: scopes get <listed id '$FIRST_SCOPE'> exits 0" test "$RC" = 0
fi
cli workflows create --name "[API-Cleanse] never-created" --type workflow --guardrail no-pii
check "workflows create --guardrail: unknown flag, 0 requests" test "$RC" != 0 -a "$REQS" = 0
cli workflows create --help
check "workflows create --help lists no guardrail flag" test "$RC" = 0 -a -z "$(grep -i guardrail "$TMP/out")"

for cmd in "scopes list --page-size 1" "workflows list --page-size 1" "connections list --page-size 1" "conversations list --page-size 1" "runs list-active"; do
  # shellcheck disable=SC2086 # word-splitting the command is the point
  cli $cmd
  check "$cmd: exit 0 and JSON output parses" exit0_and_json_parses
done

# N10: a body on stdin, a closed stdout pipe, and Ctrl-C behave like a Unix tool.
WF_NAME="[API-Cleanse] cli-stdin $(date -u +%H%M%S)-$$"
: >"$TMP/requests.log"
set +e
printf '{"name":"%s","type":"workflow"}' "$WF_NAME" |
  NODE_OPTIONS="--require $TMP/count-requests.cjs" MODUS_SMOKE_REQUEST_LOG="$TMP/requests.log" \
    "$MODUS_BIN" workflows create --body - >"$TMP/out" 2>"$TMP/err"
RC=$?
set -e
WF_ID="$(node -e 'console.log(String(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).id ?? ""))' "$TMP/out" 2>/dev/null || true)"
check "workflows create --body - reads JSON from stdin" test "$RC" = 0 -a -n "$WF_ID"
if [[ -n "$WF_ID" ]]; then
  cli workflows delete "$WF_ID"
  check "workflows delete of the stdin-created workflow '$WF_ID'" test "$RC" = 0
fi
set +e
"$MODUS_BIN" scopes list --page-size 100 2>"$TMP/err" | head -c 1 >/dev/null
RC=${PIPESTATUS[0]}
set -e
check "a closed stdout pipe is not a crash (no EPIPE trace)" test -z "$(grep -i 'EPIPE\|Unhandled' "$TMP/err")"
set +e
"$MODUS_BIN" chat "Count from 1 to 2000, one number per line, no other text." --model "$MODEL" >"$TMP/out" 2>"$TMP/err" &
CHAT_PID=$!
CHAT_AT=$SECONDS
for _ in $(seq 1 120); do [[ -s "$TMP/out" ]] && break; sleep 0.5; done
kill -INT "$CHAT_PID"
SIGINT_AT=$SECONDS
wait "$CHAT_PID"
RC=$?
set -e
check "Ctrl-C stops chat promptly with exit 130 (first output after $((SIGINT_AT - CHAT_AT)) s, $(wc -c <"$TMP/out" | tr -d ' ') bytes in all)" test "$RC" = 130 -a $((SECONDS - SIGINT_AT)) -le 5

cli chat "Reply with exactly: pong" --model "$MODEL"
check "chat streams a reply to stdout, 1 request to the agent host" \
  test "$RC" = 0 -a "$REQS" = 1 -a -n "$(tr -d '[:space:]' <"$TMP/out")" -a -n "$(grep -i '/agent/v1/modus/runs' "$TMP/requests.log")"
cli chat "My favourite fruit is the tangerine. Reply with exactly: noted" --model "$MODEL" --json
check "chat --json: every line parses, ends with done" json_lines_parse
RUN_ID="$(done_field runId 2>/dev/null || true)"
THREAD_ID="$(done_field threadId 2>/dev/null || true)"
check "chat --json: done carries runId and threadId" test -n "$RUN_ID" -a -n "$THREAD_ID"
cli chat "What is my favourite fruit? Reply with one word." --model "$MODEL" --thread "$THREAD_ID"
check "chat --thread keeps the context" out_has tangerine

cli runs interrupt "$RUN_ID" --message "Reply with exactly: two" --session "$THREAD_ID"
check "runs interrupt (finished run): JSON admission, 1 request" test "$RC" = 0 -a "$REQS" = 1
NEXT_RUN="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).runId ?? "")' "$TMP/out" 2>/dev/null || true)"
cli runs stream "$NEXT_RUN"
check "runs stream of the follow-up turn shows its reply" out_has two
cli runs edit-queued "$NEXT_RUN" --message "too late" --session "$THREAD_ID"
check "runs edit-queued (started run): exit 1, 'no longer queued', 1 request" \
  test "$RC" = 1 -a "$REQS" = 1 -a -n "$(grep -i 'no longer queued' "$TMP/err")"
cli runs interrupt "$RUN_ID" --message "x"
check "runs interrupt with no --session on a finished run: exit 3, no interrupt sent" \
  test "$RC" = 3 -a -z "$(grep interrupt "$TMP/requests.log")"
# Last on purpose: a stale decision is a 409 (exit 1) since #9867; before it the CLI printed an SSE
# `error` frame, exited 0, and the thread failed every later turn.
cli runs resume "$NEXT_RUN" --session "$THREAD_ID" --decision approve
check "runs resume with no pending decision: exit 1, 1 request" test "$RC" = 1 -a "$REQS" = 1
cli chat "Reply with exactly: still-here" --model "$MODEL" --thread "$THREAD_ID"
check "the conversation still answers after a stale resume" out_has still-here

# J2.4 write approval on a scope. The fixture is a published scope whose only tool is approval-gated
# and cannot write: on staging, scope 1553 `[API-Cleanse] approval-fixture`, GitLab "Comment on Issue"
# pinned to project_id 0 (GitLab ids start at 1, so even an approved call is a 404 there).
approval_stop_ok() { node -e 'const evs=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse); const a=evs.find((e)=>e.type==="approval_required"); process.exit(a && a.toolName && String(a.args?.project_id)==="0" && a.id && evs.at(-1)?.type==="done" ? 0 : 1)' "$TMP/out"; }
# Deny, so nothing could write.
scope_deny_journey() {
  # Another member cannot answer it (404).
  if [[ -n "${MODUS_MEMBER_API_KEY:-}" ]]; then
    MODUS_API_KEY="$MODUS_MEMBER_API_KEY" cli runs resume "$AP_RUN" --session "$AP_THREAD" --decision deny
    [[ "$RC" = 4 && "$REQS" = 1 ]] || return 1
  fi
  cli runs resume "$AP_RUN" --session "$AP_THREAD" --decision deny --json
  [[ "$RC" = 0 ]] && grep -q '"type":"done"' "$TMP/out" || return 1
  cli runs resume "$AP_RUN" --session "$AP_THREAD" --decision deny
  [[ "$RC" = 1 && "$REQS" = 1 ]] && grep -q 'CONFLICT' "$TMP/err" || return 1
  cli scopes chat "$MODUS_APPROVAL_SCOPE_ID" "Reply with exactly: pong" --model "$MODEL" --thread "$AP_THREAD"
  out_has pong
}
if [[ -n "${MODUS_APPROVAL_SCOPE_ID:-}" ]]; then
  # The pinned tool call needs a model that follows it; the cheap one may not call tools.
  cli scopes chat "$MODUS_APPROVAL_SCOPE_ID" "Post the test comment." --model claude-sonnet-5 --json
  check "scopes chat on the approval fixture stops at approval_required (its call, project 0, an id), then done" approval_stop_ok
  AP_RUN="$(done_field runId 2>/dev/null || true)"
  AP_THREAD="$(done_field threadId 2>/dev/null || true)"
  check "a scope approval: deny ends cleanly, a second resume is a 409, the thread answers" scope_deny_journey
else
  echo "skip J2.4 write approval: MODUS_APPROVAL_SCOPE_ID is unset"
fi

exit "$FAILED"
