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
  ScopesController_restore: 'phase 2 — pending',
  ScopesController_patchMcpConfig: 'phase 2 — pending',
  ScopesController_getVariation: 'phase 2 — pending',
  ScopesController_requestOwnershipTransfer: 'phase 2 — pending',
  ScopesController_cancelOwnershipTransfer: 'phase 2 — pending',
  ScopesController_acceptOwnershipTransfer: 'phase 2 — pending',
  ScopeMemoriesController_list: 'phase 2 — pending',
  ScopeMemoriesController_search: 'phase 2 — pending',
  ScopeMemoriesController_update: 'phase 2 — pending',
  ScopeMemoriesController_delete: 'phase 2 — pending',
  ScopeSupervisionController_get: 'phase 2 — pending',
  ScopeSupervisionController_set: 'phase 2 — pending',
  ScopeSupervisionController_setActive: 'phase 2 — pending',
  EvaluationsController_getConfig: 'phase 2 — pending',
  EvaluationsController_updateConfig: 'phase 2 — pending',
  EvaluationsController_triggerRun: 'phase 2 — pending',
  EvaluationsController_listRuns: 'phase 2 — pending',
  EvaluationsController_getRun: 'phase 2 — pending',

  // --- Suggestions ---
  SuggestionsController_listApproved: 'phase 2 — pending',
  SuggestionsController_recordEvent: 'phase 2 — pending',

  // --- Usage ---
  UsageController_list: 'modus usage list',
  UsageController_listUsers: 'phase 2 — pending',


  // --- Users ---
  MemberGroupsController_list: 'phase 2 — pending',
  OrgMembersController_list: 'phase 2 — pending',

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
  WorkflowsController_restore: 'phase 2 — pending',
  WorkflowsController_requestOwnershipTransfer: 'phase 2 — pending',
  WorkflowsController_cancelOwnershipTransfer: 'phase 2 — pending',
  WorkflowsController_acceptOwnershipTransfer: 'phase 2 — pending',
}
