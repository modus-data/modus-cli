# Changelog

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
