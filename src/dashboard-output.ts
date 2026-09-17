import type { DashboardElementResult, DashboardElementsList } from '@getmodus/sdk/management'
import { renderTable } from './output.js'

/** `x,y,w,h`, or blank when the element has no grid position. */
export function formatLayout(layout: Record<string, unknown> | null | undefined): string {
  if (!layout) return ''
  return ['x', 'y', 'w', 'h'].map((key) => String(layout[key] ?? '')).join(',')
}

/** --pretty for `context dashboards elements list`: a revision header, then one row per element. */
export function renderElementsList(listed: DashboardElementsList): string {
  const header = `dashboard: ${listed.dashboardId}\ndraft revision: ${listed.draftRevision}`
  const rows = listed.elements.map((element) => ({
    id: element.id,
    kind: element.kind,
    title: element.title,
    layout: formatLayout(element.layout),
  }))
  return `${header}\n\n${renderTable(rows, ['id', 'kind', 'title', 'layout'])}`
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
