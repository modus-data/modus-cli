/**
 * Single source of truth: which OpenAPI operations the CLI exposes.
 *
 * Mirrors modus-sdk/tests/contract/operation_coverage.ts. Every operation in
 * openapi/v1.json must appear here with an explicit decision: `mapped` (a
 * real command exists) or `excluded` (deliberately not CLI-facing, with a
 * reason and a CU ticket) — never silently absent. Checked in CI on every
 * PR touching the public specs (see the `openapi-contract` job in
 * `_reusable-branch-ci.yml`), not just at release time.
 */

/** operationId → coverage decision. */
export type CoverageEntry =
  | { status: 'mapped'; command: string }
  | { status: 'excluded'; reason: string; ticket: string }

export const OPERATIONS: Record<string, CoverageEntry> = {
  // --- Connections ---
  ConnectionsController_list: { status: 'mapped', command: 'modus connections list' },

  // --- Context items ---
  ContextItemsController_list: { status: 'mapped', command: 'modus context items list' },
  ContextItemsController_get: { status: 'mapped', command: 'modus context items get' },
  ContextItemsController_update: { status: 'mapped', command: 'modus context items update' },
  ContextItemsController_delete: { status: 'mapped', command: 'modus context items delete' },
  ContextItemsController_listValues: { status: 'mapped', command: 'modus context items values' },
  ContextItemsController_lookup: { status: 'mapped', command: 'modus context items lookup' },

  // --- Custom context items ---
  CustomContextItemsController_list: { status: 'mapped', command: 'modus context custom-items list' },
  CustomContextItemsController_create: { status: 'mapped', command: 'modus context custom-items create' },
  CustomContextItemsController_batchCreate: { status: 'mapped', command: 'modus context custom-items batch-create' },
  CustomContextItemsController_get: { status: 'mapped', command: 'modus context custom-items get' },
  CustomContextItemsController_update: { status: 'mapped', command: 'modus context custom-items update' },
  CustomContextItemsController_delete: { status: 'mapped', command: 'modus context custom-items delete' },

  // --- Context creators ---
  ContextCreatorsController_createLink: { status: 'mapped', command: 'modus context links create' },
  ContextCreatorsController_createNote: { status: 'mapped', command: 'modus context notes create' },
  ContextCreatorsController_createSavedQuery: { status: 'mapped', command: 'modus context saved-queries create' },

  // --- Org-level Modus ---
  ModusChatController_chat: { status: 'mapped', command: 'modus chat "message"' },
  ModusChatController_chatContinue: { status: 'mapped', command: 'modus chat "message" --thread <id>' },
  ModusContextController_compose: { status: 'mapped', command: 'modus context compose' },
  ModusConversationsController_list: { status: 'mapped', command: 'modus conversations list' },
  ModusConversationsController_get: { status: 'mapped', command: 'modus conversations get' },

  // --- Scopes ---
  ScopesController_list: { status: 'mapped', command: 'modus scopes list' },
  ScopesController_create: { status: 'mapped', command: 'modus scopes create' },
  ScopesController_get: { status: 'mapped', command: 'modus scopes get' },
  ScopesController_update: { status: 'mapped', command: 'modus scopes update' },
  ScopesController_delete: { status: 'mapped', command: 'modus scopes delete' },
  ScopesController_deploy: { status: 'mapped', command: 'modus scopes deploy' },
  ScopeChatController_chat: { status: 'mapped', command: 'modus scopes chat' },
  ScopeChatController_chatContinue: { status: 'mapped', command: 'modus scopes chat <id> "message" --thread <id>' },
  ScopeContextController_compose: { status: 'mapped', command: 'modus scopes context' },
  ScopeConversationsController_list: { status: 'mapped', command: 'modus scopes conversations list' },
  ScopeConversationsController_get: { status: 'mapped', command: 'modus scopes conversations get' },
  ScopesController_restore: { status: 'mapped', command: 'modus scopes restore' },
  ScopesController_patchMcpConfig: { status: 'mapped', command: 'modus scopes mcp-config' },
  ScopesController_getVariation: { status: 'mapped', command: 'modus scopes variations get' },
  ScopesController_requestOwnershipTransfer: { status: 'mapped', command: 'modus scopes ownership request' },
  ScopesController_cancelOwnershipTransfer: { status: 'mapped', command: 'modus scopes ownership cancel' },
  ScopesController_acceptOwnershipTransfer: { status: 'mapped', command: 'modus scopes ownership accept' },
  ScopeMemoriesController_list: { status: 'mapped', command: 'modus scopes memories list' },
  ScopeMemoriesController_search: { status: 'mapped', command: 'modus scopes memories search' },
  ScopeMemoriesController_update: { status: 'mapped', command: 'modus scopes memories update' },
  ScopeMemoriesController_delete: { status: 'mapped', command: 'modus scopes memories delete' },
  ScopeSupervisionController_get: { status: 'mapped', command: 'modus scopes supervision get' },
  ScopeSupervisionController_set: { status: 'mapped', command: 'modus scopes supervision set' },
  ScopeSupervisionController_setActive: { status: 'mapped', command: 'modus scopes supervision set-active' },
  EvaluationsController_getConfig: { status: 'mapped', command: 'modus scopes evaluations get-config' },
  EvaluationsController_updateConfig: { status: 'mapped', command: 'modus scopes evaluations update-config' },
  EvaluationsController_triggerRun: { status: 'mapped', command: 'modus scopes evaluations trigger-run' },
  EvaluationsController_listRuns: { status: 'mapped', command: 'modus scopes evaluations runs list' },
  EvaluationsController_getRun: { status: 'mapped', command: 'modus scopes evaluations runs get' },

  // --- Suggestions ---
  SuggestionsController_listApproved: { status: 'mapped', command: 'modus suggestions list' },
  SuggestionsController_recordEvent: { status: 'mapped', command: 'modus suggestions record-event' },

  // --- Usage ---
  UsageController_list: { status: 'mapped', command: 'modus usage list' },
  UsageController_listUsers: { status: 'mapped', command: 'modus usage list-users' },

  // --- Tools ---
  ToolsController_list: { status: 'mapped', command: 'modus tools list' },

  // --- Users ---
  MemberGroupsController_list: { status: 'mapped', command: 'modus member-groups list' },
  OrgMembersController_list: { status: 'mapped', command: 'modus org-members list' },

  // --- Workflows ---
  WorkflowsController_list: { status: 'mapped', command: 'modus workflows list' },
  WorkflowsController_create: { status: 'mapped', command: 'modus workflows create' },
  WorkflowsController_get: { status: 'mapped', command: 'modus workflows get' },
  WorkflowsController_update: { status: 'mapped', command: 'modus workflows update' },
  WorkflowsController_delete: { status: 'mapped', command: 'modus workflows delete' },
  WorkflowsController_deploy: { status: 'mapped', command: 'modus workflows deploy' },
  WorkflowsController_toggle: { status: 'mapped', command: 'modus workflows toggle' },
  WorkflowInterfacesController_list: { status: 'mapped', command: 'modus workflows interfaces list' },
  WorkflowInterfacesController_add: { status: 'mapped', command: 'modus workflows interfaces add' },
  WorkflowInterfacesController_update: { status: 'mapped', command: 'modus workflows interfaces update' },
  WorkflowInterfacesController_delete: { status: 'mapped', command: 'modus workflows interfaces delete' },
  WorkflowInterfacesController_deleteAll: { status: 'mapped', command: 'modus workflows interfaces delete-all' },
  WorkflowRunsController_list: { status: 'mapped', command: 'modus workflows runs list' },
  WorkflowRunsController_get: { status: 'mapped', command: 'modus workflows runs get' },
  WorkflowsController_restore: { status: 'mapped', command: 'modus workflows restore' },
  WorkflowsController_requestOwnershipTransfer: { status: 'mapped', command: 'modus workflows ownership request' },
  WorkflowsController_cancelOwnershipTransfer: { status: 'mapped', command: 'modus workflows ownership cancel' },
  WorkflowsController_acceptOwnershipTransfer: { status: 'mapped', command: 'modus workflows ownership accept' },

  // --- Agent-service (run creation & lifecycle) — separate public spec from
  // modus-api, missed entirely in the CLI's first coverage pass. ScopeRunsController_create
  // and ModusRunsController_create are the same underlying endpoints `scopes chat`/`chat`
  // already hit via chatStream() (verified: identical agentHostRunsPath construction) —
  // marked covered there rather than duplicated as a separate command.
  ScopeRunsController_create: { status: 'mapped', command: 'modus scopes chat <id> "message" (same endpoint as chatStream)' },
  ModusRunsController_create: { status: 'mapped', command: 'modus chat "message" (same endpoint as chatStream)' },
  WorkflowRunsController_create: { status: 'mapped', command: 'modus workflows run' },
  ResumeRunsController_create: { status: 'mapped', command: 'modus runs resume' },
  RunLifecycleController_active: { status: 'mapped', command: 'modus runs list-active' },
  RunLifecycleController_activeBySession: { status: 'mapped', command: 'modus runs active-by-session' },
  RunLifecycleController_cancel: { status: 'mapped', command: 'modus runs cancel' },
  RunLifecycleController_events: { status: 'mapped', command: 'modus runs events' },
  RunLifecycleController_interrupt: { status: 'mapped', command: 'modus runs interrupt' },
  RunLifecycleController_editQueued: { status: 'mapped', command: 'modus runs edit-queued' },
  RunLifecycleController_stream: { status: 'mapped', command: 'modus runs stream' },
  WorkflowActionsController_execute: { status: 'mapped', command: 'modus workflow-actions execute' },
  WorkflowActionsController_cancel: { status: 'mapped', command: 'modus workflow-actions cancel' },
}
