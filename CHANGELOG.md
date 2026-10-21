# Changelog

## [Unreleased]

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
