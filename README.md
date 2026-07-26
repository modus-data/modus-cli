# @getmodus/cli

Official command-line client for [Modus](https://getmodus.com) — chat with your
scopes, manage workflows and context, and script against the Modus API from a
terminal or from an agent.

Built on [`@getmodus/sdk`](https://www.npmjs.com/package/@getmodus/sdk) — every
command is a thin wrapper over a real SDK method, so the CLI's coverage and
compatibility guarantees follow the same policy as the SDK
([`COMPATIBILITY.md`](../../../../docs/COMPATIBILITY.md)).

## Install

```bash
npm install -g @getmodus/cli
```

## Authenticate

```bash
modus login                       # prompts for a PAT (hidden input) — preferred
modus whoami                      # confirm the resolved org/token
```

`MODUS_API_KEY` and `MODUS_BASE_URL` environment variables always override the
stored credential — the preferred way to authenticate in CI/scripts. Avoid
`modus login --token modus_xxx`: a token passed as a command-line argument is
readable from shell history, `ps`, and often CI logs. If you must automate
login non-interactively, pipe the token to stdin of the hidden prompt or set
`MODUS_API_KEY` instead.

## Output

Every non-streaming command prints **compact JSON by default** — pipe it to
`jq`, feed it to a script, or hand it to an agent. Pass `--pretty` for a
human-readable table or summary instead. **Exception:** `chat`/`scopes chat`
stream raw response text to stdout by default (the natural "JSON" for a chat
command is the message itself); pass `--json` on those two to get structured
SSE-derived events instead:

```bash
modus scopes list                 # {"items":[...],"nextPageToken":null}
modus scopes list --pretty        # aligned table
```

## Examples

```bash
# Chat with a scope (streams the response, then exits)
modus scopes chat 42 "What changed in revenue last week?"

# Same, but interactive (omit the message)
modus scopes chat 42

# Create a scope — simple fields as flags
modus scopes create --name "Revenue Analyst" --model claude-sonnet-5

# Create a scope with nested config (toolset, connections, ...) — see the
# fixture for the full shape, then edit and pass it back
modus scopes create --example > scope.json
modus scopes create --file scope.json

# Deploy it
modus scopes deploy 42

# List workflows, then inspect one run
modus workflows list --pretty
modus workflows runs list 7
modus workflows runs get 7 wf_7_run_1

# Manage context
modus context items list --context-type saved_query
modus context notes create "Q3 pricing" "We raised list price 8% in July."
```

## Commands

Run `modus --help` or `modus <topic> --help` (e.g. `modus scopes --help`) for
the full, current list — this README does not duplicate it since it drifts.

## Phasing

This is a **Phase 1** release: auth, scopes, workflows, context, connections,
usage, and chat. Evaluations, memories, supervision, MCP config, ownership
transfer, suggestions, and the org member directory are Phase 2 — see
[`tests/contract/operation-coverage.ts`](tests/contract/operation-coverage.ts)
for the exact operation-by-operation status.

## Development

```bash
pnpm --filter @getmodus/cli run build
pnpm --filter @getmodus/cli exec vitest run
./bin/dev.js --help   # run from source (tsx), no build needed
```

See [`../docs/PUBLISHING.md`](../docs/PUBLISHING.md) for the release process.
