<p align="center">
  <img
    src="https://raw.githubusercontent.com/modus-data/modus-cli/main/assets/modus-logo.png"
    alt="Modus"
    width="280"
  />
</p>

<h1 align="center">Modus CLI</h1>

<p align="center">
  The official command-line client for <a href="https://getmodus.com">Modus</a> —
  chat with your scopes, manage workflows and context, and script against the
  Modus API from a terminal, a CI pipeline, or an agent.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@getmodus/cli"><img alt="npm" src="https://img.shields.io/npm/v/@getmodus/cli"></a>
  <a href="https://www.npmjs.com/package/@getmodus/cli"><img alt="Node.js" src="https://img.shields.io/node/v/@getmodus/cli"></a>
  <a href="https://opensource.org/licenses/MIT"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg"></a>
</p>

---

## Quick start

```bash
npm install -g @getmodus/cli

modus login                  # opens your browser to sign in
modus scopes list --pretty   # confirm it worked
```

Built on [`@getmodus/sdk`](https://www.npmjs.com/package/@getmodus/sdk) — every
command is a thin wrapper over a real SDK method, so the CLI follows the same
compatibility policy as the SDK
([`COMPATIBILITY.md`](../../../docs/COMPATIBILITY.md)).

## Authenticate

```bash
modus login              # browser-based OAuth (default) — interactive/local use
modus login --no-oauth   # PAT prompt instead — CI/scripts/headless
modus whoami             # confirm the resolved org/token/auth method
```

- **OAuth (default)** opens your browser and requests exactly the access your
  account already has in the SPA — nothing more, nothing held back. The access
  token refreshes automatically; `modus logout` revokes the grant server-side.
- **CI/scripts:** set `MODUS_API_KEY` and `MODUS_BASE_URL` — these always
  override the stored credential and are the preferred way to authenticate
  non-interactively.
- Avoid `modus login --token modus_xxx` — a token on the command line is
  readable from shell history, `ps`, and CI logs.

<details>
<summary><strong>Non-standard deployments &amp; staging</strong></summary>

- `--issuer` — only needed if the OAuth authorization server doesn't live at
  the `app.*` counterpart of `--base-url` (e.g. local dev).
- **Staging:** `chat` and `scopes chat` route through the agent service, not
  the REST API — set `MODUS_AGENT_HOST` (e.g.
  `https://agent.staging.getmodus.com`) alongside `MODUS_BASE_URL`, or those
  commands silently hit production and fail with `Invalid access token`.

</details>

## Output

- Every non-streaming command prints **compact JSON by default** — pipe it to
  `jq`, a script, or an agent.
- Pass `--pretty` for a human-readable table or summary instead.
- **Exception:** `chat` / `scopes chat` stream raw response text by default;
  pass `--json` on those two for structured SSE events instead.

```bash
modus scopes list             # {"items":[...],"nextPageToken":null}
modus scopes list --pretty    # aligned table
```

## Examples

```bash
# Chat with a scope (streams the response, then exits)
modus scopes chat 42 "What changed in revenue last week?"
modus scopes chat 42                        # same, but interactive

# Create a scope, then deploy it
modus scopes create --name "Revenue Analyst" --model claude-sonnet-5
modus scopes create --example > scope.json  # full config fixture
modus scopes create --file scope.json
modus scopes deploy 42

# Workflows
modus workflows list --pretty
modus workflows runs list 7
modus workflows runs get 7 wf_7_run_1
modus workflows run 42 "Run the weekly digest now"

# Context
modus context items list --context-type saved_query
modus context notes create "Q3 pricing" "We raised list price 8% in July."

# Active runs
modus runs list-active --pretty
modus runs cancel <runId>
```

## Commands

Run `modus --help` or `modus <topic> --help` (e.g. `modus scopes --help`) for
the full, current list — this README doesn't duplicate it since it drifts.

## Coverage

The CLI covers the full public API surface:

- Auth, scopes (evaluations, memories, supervision, MCP config, ownership
  transfer), workflows (ownership transfer), context, connections, usage,
  chat, suggestions, org members, and run/workflow-action lifecycle.
- Two independent public services, both covered: `api.getmodus.com`
  (modus-api) and `agent.getmodus.com` (agent-service).

See
[`tests/contract/operation-coverage.ts`](tests/contract/operation-coverage.ts)
for the exact operation-by-operation mapping.

## Development

```bash
pnpm --filter @getmodus/cli run build
pnpm --filter @getmodus/cli exec vitest run
./bin/dev.js --help   # run from source (tsx), no build needed
```

See [`../docs/PUBLISHING.md`](../docs/PUBLISHING.md) for the release process.
