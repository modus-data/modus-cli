import type { Page } from '@getmodus/sdk'

// Confirmed against real staging data: untruncated free-text fields (e.g. context
// item descriptions) make a --pretty table unreadable — cap and ellipsize.
const MAX_CELL_WIDTH = 60

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  const raw = typeof value === 'object' ? JSON.stringify(value) : String(value)
  // Confirmed against real staging data: a field like firstMessage can contain
  // embedded newlines, which breaks single-line row alignment — flatten first.
  const text = raw.replace(/\s*\n\s*/g, ' ')
  return text.length > MAX_CELL_WIDTH ? `${text.slice(0, MAX_CELL_WIDTH - 1)}…` : text
}

/**
 * ponytail: one generic key-based table renderer for every resource instead of
 * a bespoke pretty-printer per command. Callers pass which columns matter;
 * add per-resource formatting (colors, custom widths) only if this stops
 * reading well in practice.
 */
export function renderTable(rows: Array<Record<string, unknown>>, columns: string[]): string {
  if (rows.length === 0) return '(no results)'
  const widths = columns.map((col) =>
    Math.max(col.length, ...rows.map((row) => cellText(row[col]).length)),
  )
  const renderRow = (values: string[]) => values.map((v, i) => v.padEnd(widths[i])).join('  ')
  const lines = [
    renderRow(columns),
    widths.map((w) => '-'.repeat(w)).join('  '),
    ...rows.map((row) => renderRow(columns.map((col) => cellText(row[col])))),
  ]
  return lines.join('\n')
}

/** Table rendering for a page's items — call only from the --pretty branch of `BaseCommand.print`. */
export function renderPage<T extends Record<string, unknown>>(page: Page<T>, columns: string[]): string {
  const table = renderTable(page.items, columns)
  return page.hasNextPage() ? `${table}\n\nnext page token: ${page.nextPageToken}` : table
}

/** Explicit {items, nextPageToken} shape for the JSON branch, independent of Page's own serialization. */
export function pageEnvelope<T>(page: Page<T>): { items: T[]; nextPageToken: string | null } {
  return { items: page.items, nextPageToken: page.nextPageToken ?? null }
}
