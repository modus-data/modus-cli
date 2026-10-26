# Changelog

## [Unreleased]

- **Breaking (pre-1.0):** `workflows create` and `workflows update` no longer take `--guardrail`. Workflows have no guardrails, so every call that set it failed with 400. `scopes create|update --guardrail` is unchanged.
- **Fixed:** `scopes memories update` prints a confirmation (`{"updated":true,"memoryId":...}`) instead of `null`; the server answers 204 with no body.
- **Fixed:** help and examples use numeric ids. `workflows get` said "id or slug", and examples passed slugs such as `weekly-digest`, which the server rejects with 400.
- **Breaking (pre-1.0).** Scope `connectionSet` rows have one shape. `scopes create` and `scopes update` accept each entry only as `{ connection_id, path, preferences?, context_enabled? }`, where `path` is an array of strings, `preferences` an object and `context_enabled` a boolean. An empty path selects the whole connection. Any other field, a non-string path segment, an empty or null `connection_id`, or a null `connectionSet` is rejected with 400. A `scopes get` row can be sent back on update.
- **Breaking (pre-1.0):** a command that sends a POST (for example `scopes create`) no longer re-sends it after a 5xx or a timeout, since the first one may already have run; it fails and you decide whether to retry. GET, PUT, PATCH and DELETE are still retried, every method is retried on 429 or a connection that never opened, and so are the POSTs that only read or set a state (context compose, item lookup, memory search, active-run lookup, run cancel, run interrupt, workflow-action cancel, workflow toggle, ingested-data upload).
- **Breaking (pre-1.0):** `runs interrupt RUN_ID` and `runs edit-queued RUN_ID` require `--message` and take an optional `--session` (default: the run's session from `runs list-active`). Both always failed before. `runs interrupt` prints the new run that carries the follow-up turn (`runId`, `status`); stream it with `runs stream`. On a finished run it starts a follow-up turn.
- **Breaking (pre-1.0):** `runs resume` no longer takes a message argument. A resume sends only the decision; the server rejected any non-empty message.
- Scope `toolset` on create and update is a map of tool key to its configuration. A body shaped `{ "tools": [...] }` is rejected. Unknown keys are rejected.
- Known scope `toolset` values are validated. Most tools take an array of strings. `file_publish` takes `{ actions: string[], rules?: { nameMode: "any" | "restricted", allowedNames: string[] } }`. Coding tools take an array of `{ connectionUid, repoOwner, repoName, branch }`. `sql_runner` entries are `VERB:connectionId:`, optionally followed by `database:schema`, where `VERB` is `SELECT`, `INSERT`, `UPDATE`, `DELETE`, or `CREATE`. A value that does not match is rejected with `toolset.bad_value`; an unknown key stays `toolset.unknown_key`. Resending an unchanged stored value succeeds, including a historical value the new check would reject, and removing it succeeds.
- MCP config on `scopes create`, `scopes update`, and `scopes mcp-config` returns the effective config. Core tools are booleans. Tool exposure is version 1 with mode `subset` or `discovery`. A newly added exposure key must be one the scope can expose. A key already stored can be sent again or removed.
- **Added:** `scopes evaluations cases add|update|delete` adds, changes, or removes one evaluation case. Omit `--case-id` on add and one is assigned. `delete` asks for confirmation unless `--yes` is passed. An empty `--task` is allowed. An update with neither field is rejected.
- **Removed:** scope evaluation cases no longer include `createdAt` or `updatedAt`.
- **Changed:** `scopes update` evaluation cases are `{id?, task, expectedOutput}`. Omit `id` on a new case and one is assigned. A repeated `id` is rejected. An empty `task` is allowed.
- Scope `interfaces` on `scopes create` and `scopes update` accept only MCP rows (`type` must be `mcp`). Each row has an optional id and name and a config. A row without an id or name is assigned one. Responses return id, type, name, and config.
- Workflow responses declare `trigger`, `workflowStructure`, and `agentSelection` as the published shapes. A non-schedule trigger has `schedule: null`, and a schedule leaves unused cadence fields null. Workflow interface `config` describes Slack and Teams access fields and an empty object for MCP.
- `connections selections CONNECTION_ID` lists the selectable units on a connection
  (`GET /connections/{id}/selections`). `connections list` may include `selectionModel`.
- Scope `connectionSet` rows must be a selectable unit. `scopes create` and `scopes update` reject a new row whose path is neither the whole connection nor one selectable unit of it, with 422 `root.not_a_root`. A row already stored can stay, and removing it still succeeds.
- Workflow interface `config` for Slack and Teams is `accessMode`, `allowedEmails`, and `availableChannelIds`. An MCP interface accepts no config keys. Invalid config returns 422; sending the stored config back unchanged still succeeds.
- `context custom-items list --search-query` (`GET /context/custom-items`) help describes word
  search: it returns rows that contain every word of the query, case-insensitive.
- Recognise service-account tokens (`modus_sat_…`); `whoami` reports the token `kind` (personal, service or oauth).
- Requests carry `X-Modus-Client: cli`, so usage is attributed to the CLI.
- `context items move UID --destination-folder-uid FOLDER_UID` moves a live file
  or Files folder. An empty `--destination-folder-uid` moves to the Files root.
- `context items list` gains repeatable `--parent-uid`, `--ancestor-uid`, and
  `--connection-id` for generic hierarchy browse. A single empty `--parent-uid ""`
  lists the known-empty root (`connectionIds=files` is the Files root).
- `context files upload` and `upload-from-url` gain `--folder-path` to upload under a root-relative folder.
- Add `scopes interfaces list|add|update|delete` for Slack and Microsoft Teams interfaces on a scope; `delete` asks for confirmation unless `--yes` is passed.
- Add `ingested-data upload` for immutable SQL and HTTP request/response data; it accepts an optional source response status and prints the stored checksum.
- Add `context custom-items create-relations`.
- Add `context dashboards elements list|get|create|update` and `context dashboards layout update`.
- Add `context dashboards list|get|create|delete|update-draft|publish`, `context dashboards versions list|get|restore`,
  `context dashboards snapshots list`, `context dashboards access update`, and
  `context dashboards ownership request|accept|cancel`.
- `conversations list` and `scopes conversations list` gain `--source` and
  `--source-ref` flags to filter by UI surface (e.g. `dashboard_copilot`).

## [0.1.2]

- Client-facing README pass: logo, badges, tightened copy, and an accurate
  coverage summary in place of the stale "Phase 2 pending" note.

## [0.1.1]

- Fixed the published `0.1.0` tarball's `@getmodus/sdk` dependency, which
  pointed at an unpublished placeholder version and broke `npm install`.

## [0.1.0]

Initial release: auth (`login`/`logout`/`whoami`, including OAuth), scopes,
workflows, context, connections, usage, tools, chat, and run/workflow-action
lifecycle commands — the full public API surface, not just Phase 1. See the
package README for scope and `tests/contract/operation-coverage.ts` for exact
operation coverage.
