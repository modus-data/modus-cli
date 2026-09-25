import type {
  Dashboard,
  DashboardDraftSnapshot,
  DashboardElementResult,
  DashboardElementsList,
  DashboardVersion,
} from '@getmodus/sdk/management'
import { renderTable } from './output.js'

/** `x,y,w,h`, or blank when the element has no grid position. */
export function formatLayout(layout: Record<string, unknown> | null | undefined): string {
  if (!layout) return ''
  return ['x', 'y', 'w', 'h'].map((key) => String(layout[key] ?? '')).join(',')
}

interface ElementRow {
  id: string
  kind: string
  title: string | null | undefined
  layout: Record<string, unknown> | null | undefined
}

function renderElementRows(rows: ElementRow[]): string {
  return renderTable(
    rows.map(({ id, kind, title, layout }) => ({ id, kind, title, layout: formatLayout(layout) })),
    ['id', 'kind', 'title', 'layout'],
  )
}

/** --pretty for `context dashboards elements list`: a revision header, then one row per element. */
export function renderElementsList(listed: DashboardElementsList): string {
  const header = `dashboard: ${listed.dashboardId}\ndraft revision: ${listed.draftRevision}`
  return `${header}\n\n${renderElementRows(listed.elements)}`
}

// Already shown in the header rows of `renderElement`.
const HEADER_FIELDS = new Set(['id', 'kind', 'title', 'layout'])

// Listed first, in this order; any other setting follows alphabetically so a new
// element setting is never silently hidden.
const KNOWN_FIELDS = [
  'connectionId',
  'format',
  'filterType',
  'required',
  'allowMultiple',
  'quotation',
  'options',
  'optionsQuery',
  'defaultValue',
  'regex',
  'sqlReferences',
  'sql',
  'chartConfig',
  'markdown',
]

function settingOrder(a: string, b: string): number {
  const ai = KNOWN_FIELDS.indexOf(a)
  const bi = KNOWN_FIELDS.indexOf(b)
  if (ai === -1 && bi === -1) return a.localeCompare(b)
  if (ai === -1) return 1
  if (bi === -1) return -1
  return ai - bi
}

/** --pretty for `context dashboards elements get`: a field/value table of every element setting. */
export function renderElement(result: DashboardElementResult): string {
  const { element } = result
  const rows: Array<Record<string, unknown>> = [
    { field: 'dashboardId', value: result.dashboardId },
    { field: 'draftRevision', value: result.draftRevision },
    { field: 'id', value: element.id },
    { field: 'kind', value: element.kind },
    { field: 'title', value: element.title },
    { field: 'layout', value: formatLayout(element.layout) },
  ]
  const settings = Object.entries(element)
    .filter(([field, value]) => !HEADER_FIELDS.has(field) && value !== undefined)
    .sort(([a], [b]) => settingOrder(a, b))
  for (const [field, value] of settings) rows.push({ field, value })
  return renderTable(rows, ['field', 'value'])
}

/** --pretty for `context dashboards list`: one row per dashboard. */
export function renderDashboardsList(dashboards: Dashboard[]): string {
  const rows = dashboards.map((dashboard) => ({
    id: dashboard.id,
    title: dashboard.title,
    view: dashboard.view,
    version: dashboard.selectedVersion.versionNumber,
    draftRevision: dashboard.draftRevision,
    visibility: dashboard.access.visibility,
    updatedAt: dashboard.updatedAt,
  }))
  return renderTable(rows, ['id', 'title', 'view', 'version', 'draftRevision', 'visibility', 'updatedAt'])
}

// The definition's layout is an open object; element positions live under `elements`.
function elementLayouts(definition: Dashboard['definition']): Record<string, Record<string, unknown>> {
  const elements = (definition.layout as { elements?: unknown } | undefined)?.elements
  return elements && typeof elements === 'object' ? (elements as Record<string, Record<string, unknown>>) : {}
}

/** --pretty for `context dashboards get` and `versions get`: the dashboard fields, then every tile and filter. */
export function renderDashboard(dashboard: Dashboard): string {
  const fields: Array<Record<string, unknown>> = [
    { field: 'id', value: dashboard.id },
    { field: 'title', value: dashboard.title },
    { field: 'description', value: dashboard.description },
    { field: 'view', value: dashboard.view },
    { field: 'version', value: dashboard.selectedVersion.versionNumber },
    { field: 'draftRevision', value: dashboard.draftRevision },
    { field: 'visibility', value: dashboard.access.visibility },
    { field: 'owner', value: dashboard.access.ownerEmail ?? dashboard.access.ownerUserId },
    { field: 'pendingOwner', value: dashboard.pendingOwnershipTransfer?.pendingOwnerUserId },
    { field: 'updatedAt', value: dashboard.updatedAt },
  ]
  const layouts = elementLayouts(dashboard.definition)
  const elements = [
    ...dashboard.definition.tiles.map((tile) => ({
      id: tile.id,
      kind: tile.kind,
      title: tile.title,
      layout: layouts[tile.id],
    })),
    ...dashboard.definition.filters.map((filter) => ({
      id: filter.id,
      kind: 'filter',
      title: filter.label,
      layout: layouts[filter.id],
    })),
  ]
  return `${renderTable(fields, ['field', 'value'])}\n\n${renderElementRows(elements)}`
}

/** --pretty for `context dashboards versions list`: one row per published version. */
export function renderVersionsList(versions: DashboardVersion[]): string {
  const rows = versions.map((version) => ({ ...version }))
  return renderTable(rows, ['uid', 'versionNumber', 'kind', 'title', 'createdByUserId', 'createdAt'])
}

/** --pretty for `context dashboards snapshots list`: one row per draft snapshot. */
export function renderDraftSnapshots(snapshots: DashboardDraftSnapshot[]): string {
  const rows = snapshots.map((snapshot) => ({ ...snapshot }))
  return renderTable(rows, ['uid', 'createdByUserId', 'createdAt'])
}
