/**
 * Single source of truth: which OpenAPI operations the CLI exposes.
 *
 * Mirrors modus-sdk/tests/contract/operation_coverage.ts. Every operation in
 * openapi/v1.json must appear here with a note on where the CLI command
 * lives, or "phase 2 — pending" per the CLI design spec's phasing.
 */

/** operationId → short note on where/how the CLI exposes it. */
export const OPERATIONS: Record<string, string> = {
  // --- Connections ---
  ConnectionsController_list: 'modus connections list',

  // --- Context items ---
  ContextItemsController_list: 'modus context items list',
  ContextItemsController_get: 'modus context items get',
  ContextItemsController_update: 'modus context items update',
  ContextItemsController_delete: 'modus context items delete',
  ContextItemsController_listValues: 'modus context items values',
  ContextItemsController_lookup: 'modus context items lookup',

  // --- Custom context items ---
  CustomContextItemsController_list: 'modus context custom-items list',
  CustomContextItemsController_create: 'modus context custom-items create',
  CustomContextItemsController_batchCreate: 'modus context custom-items batch-create',
  CustomContextItemsController_get: 'modus context custom-items get',
  CustomContextItemsController_update: 'modus context custom-items update',
  CustomContextItemsController_delete: 'modus context custom-items delete',

  // --- Context creators ---
  ContextCreatorsController_createLink: 'modus context links create',
  ContextCreatorsController_createNote: 'modus context notes create',
  ContextCreatorsController_createSavedQuery: 'modus context saved-queries create',

  // --- Org-level Modus ---
  ModusChatController_chat: 'modus chat "message"',
  ModusChatController_chatContinue: 'modus chat "message" --thread <id>',
  ModusContextController_compose: 'modus context compose',
  ModusConversationsController_list: 'modus conversations list',
  ModusConversationsController_get: 'modus conversations get',

  // --- Scopes ---
  ScopesController_list: 'modus scopes list',
  ScopesController_create: 'modus scopes create',
  ScopesController_get: 'modus scopes get',
  ScopesController_update: 'modus scopes update',
  ScopesController_delete: 'modus scopes delete',
  ScopesController_deploy: 'modus scopes deploy',
  ScopeChatController_chat: 'modus scopes chat',
  ScopeChatController_chatContinue: 'modus scopes chat <id> "message" --thread <id>',
  ScopeContextController_compose: 'modus scopes context',
  ScopeConversationsController_list: 'modus scopes conversations list',
  ScopeConversationsController_get: 'modus scopes conversations get',
  ScopesController_restore: 'modus scopes restore',
  ScopesController_patchMcpConfig: 'modus scopes mcp-config',
  ScopesController_getVariation: 'modus scopes variations get',
  ScopesController_requestOwnershipTransfer: 'modus scopes ownership request',
  ScopesController_cancelOwnershipTransfer: 'modus scopes ownership cancel',
  ScopesController_acceptOwnershipTransfer: 'modus scopes ownership accept',
  ScopeMemoriesController_list: 'modus scopes memories list',
  ScopeMemoriesController_search: 'modus scopes memories search',
  ScopeMemoriesController_update: 'modus scopes memories update',
  ScopeMemoriesController_delete: 'modus scopes memories delete',
  ScopeSupervisionController_get: 'modus scopes supervision get',
  ScopeSupervisionController_set: 'modus scopes supervision set',
  ScopeSupervisionController_setActive: 'modus scopes supervision set-active',
  EvaluationsController_getConfig: 'modus scopes evaluations get-config',
  EvaluationsController_updateConfig: 'modus scopes evaluations update-config',
  EvaluationsController_triggerRun: 'modus scopes evaluations trigger-run',
  EvaluationsController_listRuns: 'modus scopes evaluations runs list',
  EvaluationsController_getRun: 'modus scopes evaluations runs get',

  // --- Suggestions ---
  SuggestionsController_listApproved: 'modus suggestions list',
  SuggestionsController_recordEvent: 'modus suggestions record-event',

  // --- Usage ---
  UsageController_list: 'modus usage list',
  UsageController_listUsers: 'modus usage list-users',

  // --- Tools ---
  ToolsController_list: 'modus tools list',

  // --- Users ---
  MemberGroupsController_list: 'modus member-groups list',
  OrgMembersController_list: 'modus org-members list',

  // --- Workflows ---
  WorkflowsController_list: 'modus workflows list',
  WorkflowsController_create: 'modus workflows create',
  WorkflowsController_get: 'modus workflows get',
  WorkflowsController_update: 'modus workflows update',
  WorkflowsController_delete: 'modus workflows delete',
  WorkflowsController_deploy: 'modus workflows deploy',
  WorkflowsController_toggle: 'modus workflows toggle',
  WorkflowInterfacesController_list: 'modus workflows interfaces list',
  WorkflowInterfacesController_add: 'modus workflows interfaces add',
  WorkflowInterfacesController_update: 'modus workflows interfaces update',
  WorkflowInterfacesController_delete: 'modus workflows interfaces delete',
  WorkflowInterfacesController_deleteAll: 'modus workflows interfaces delete-all',
  WorkflowRunsController_list: 'modus workflows runs list',
  WorkflowRunsController_get: 'modus workflows runs get',
  WorkflowsController_restore: 'modus workflows restore',
  WorkflowsController_requestOwnershipTransfer: 'modus workflows ownership request',
  WorkflowsController_cancelOwnershipTransfer: 'modus workflows ownership cancel',
  WorkflowsController_acceptOwnershipTransfer: 'modus workflows ownership accept',

  // --- Agent-service (run creation & lifecycle) — separate public spec from
  // modus-api, missed entirely in the CLI's first coverage pass. ScopeRunsController_create
  // and ModusRunsController_create are the same underlying endpoints `scopes chat`/`chat`
  // already hit via chatStream() (verified: identical agentHostRunsPath construction) —
  // marked covered there rather than duplicated as a separate command.
  ScopeRunsController_create: 'modus scopes chat <id> "message" (same endpoint as chatStream)',
  ModusRunsController_create: 'modus chat "message" (same endpoint as chatStream)',
  WorkflowRunsController_create: 'modus workflows run',
  ResumeRunsController_create: 'modus runs resume',
  RunLifecycleController_active: 'modus runs list-active',
  RunLifecycleController_activeBySession: 'modus runs active-by-session',
  RunLifecycleController_cancel: 'modus runs cancel',
  RunLifecycleController_events: 'modus runs events',
  RunLifecycleController_interrupt: 'modus runs interrupt',
  RunLifecycleController_editQueued: 'modus runs edit-queued',
  RunLifecycleController_stream: 'modus runs stream',
  WorkflowActionsController_execute: 'modus workflow-actions execute',
  WorkflowActionsController_cancel: 'modus workflow-actions cancel',
}
