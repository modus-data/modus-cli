<p align="center">
  <img
    src="https://raw.githubusercontent.com/modus-data/modus-cli/main/assets/modus-logo.png"
    alt="Modus"
    width="280"
  />
</p>

# Modus CLI

[![npm](https://img.shields.io/npm/v/@getmodus/cli)](https://www.npmjs.com/package/@getmodus/cli)
[![Node.js](https://img.shields.io/node/v/@getmodus/cli)](https://www.npmjs.com/package/@getmodus/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

The official command-line client for [Modus](https://getmodus.com) — your
organization's context layer for AI. Chat with your scopes, trigger and manage
workflows, and read or write organization context, all from a terminal, a
script, or an agent.

Every command is a thin wrapper over [`@getmodus/sdk`](https://www.npmjs.com/package/@getmodus/sdk),
so the CLI's coverage and compatibility guarantees follow the same policy as
the SDK ([`COMPATIBILITY.md`](../../../docs/COMPATIBILITY.md)).

## Install

```bash
npm install -g @getmodus/cli
```

## Authenticate

```bash
modus login                       # browser-based OAuth (default) — preferred for interactive/local use
modus login --no-oauth            # prompts for a PAT (hidden input) instead — preferred for CI/scripts/headless
modus whoami                      # confirm the resolved org/token/auth method
```

`MODUS_API_KEY` and `MODUS_BASE_URL` environment variables always override the
stored credential — the preferred way to authenticate in CI/scripts. Avoid
`modus login --token modus_xxx`: a token passed as a command-line argument is
readable from shell history, `ps`, and often CI logs. If you must automate
login non-interactively, pipe the token to stdin of `modus login --no-oauth`'s
hidden prompt, or set `MODUS_API_KEY` instead.

`modus login` opens your browser to sign in and requests every scope the
server currently advertises — the consent/token exchange narrows this down to
whatever your account's role actually allows, the same access you already have
in the SPA, nothing more and nothing the CLI holds back. It then stores a
rotating access/refresh token pair — `modus` transparently refreshes the
access token (1-hour lifetime) before it expires, so you only re-authenticate
when the 30-day refresh token itself expires or is revoked. `modus logout`
revokes the grant server-side in addition to clearing the local credential.
Add `--issuer` only for non-standard deployments (e.g. local dev) where the
OAuth authorization server doesn't live at the `app.*` counterpart of
`--base-url`.

**Testing against a non-default environment (e.g. staging):** `chat`, `scopes
chat`, and their conversation-continuation calls route through the agent
service, not the REST API — set `MODUS_AGENT_HOST` (e.g.
`https://agent.staging.getmodus.com`) alongside `MODUS_BASE_URL`, or those
commands silently hit the production agent host with a token scoped to a
different environment and fail with "Invalid access token".

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

# Trigger a workflow run now (ad-hoc), and manage it
modus workflows run 42 "Run the weekly digest now"
modus runs list-active --pretty
modus runs cancel <runId>
```

## Commands

Run `modus --help` or `modus <topic> --help` (e.g. `modus scopes --help`) for
the full, current list — this README does not duplicate it since it drifts.

## Coverage

The CLI covers the full public API surface: auth, scopes (including
evaluations, memories, supervision, MCP config, and ownership transfer),
workflows (including ownership transfer), context, connections, usage, chat,
suggestions, the org member directory, and run/workflow-action
creation and lifecycle. `api.getmodus.com` (modus-api) and
`agent.getmodus.com` (agent-service) are two independent public services with
two independent OpenAPI specs — the CLI's coverage tracks both; see
[`tests/contract/operation-coverage.ts`](tests/contract/operation-coverage.ts)
for the exact operation-by-operation mapping.

## Development

```bash
pnpm --filter @getmodus/cli run build
pnpm --filter @getmodus/cli exec vitest run
./bin/dev.js --help   # run from source (tsx), no build needed
```

See [`../docs/PUBLISHING.md`](../docs/PUBLISHING.md) for the release process.
