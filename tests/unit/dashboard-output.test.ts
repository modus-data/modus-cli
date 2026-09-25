import type {
  Dashboard,
  DashboardDraftSnapshot,
  DashboardElementResult,
  DashboardElementsList,
  DashboardVersion,
} from '@getmodus/sdk/management'
import { describe, expect, it } from 'vitest'
import {
  formatLayout,
  renderDashboard,
  renderDashboardsList,
  renderDraftSnapshots,
  renderElement,
  renderElementsList,
  renderVersionsList,
} from '../../src/dashboard-output.js'

const access = {
  visibility: 'private',
  groupPermissions: {},
  sharedWith: [],
  ownerUserId: 'user_owner',
  ownerEmail: 'owner@example.com',
} as Dashboard['access']

function dashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    id: 'dash-1',
    contextItemId: 'ctx-1',
    title: 'Revenue',
    description: 'Monthly revenue',
    access,
    definition: {
      tiles: [{ id: 't1', title: 'By region', kind: 'table', sql: 'select 1', config: {} }],
      filters: [{ id: 'region', label: 'Region', type: 'string', required: false }],
      layout: { elements: { t1: { x: 0, y: 0, w: 12, h: 4 } }, filterConfigs: {} },
    },
    view: 'active',
    selectedVersion: {
      id: 'ver-2',
      versionNumber: 2,
      createdByUserId: 'user_owner',
      createdAt: '2026-09-16T10:00:00.000Z',
      access,
    },
    draftRevision: 5,
    activeVersionId: 'ver-2',
    updatedByUserId: 'user_owner',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
    pendingOwnershipTransfer: null,
    canUse: true,
    canManage: true,
    ...overrides,
  } as Dashboard
}

describe('formatLayout', () => {
  it('joins the grid position, and is blank without one', () => {
    expect(formatLayout({ x: 0, y: 2, w: 6, h: 4 })).toBe('0,2,6,4')
    expect(formatLayout(null)).toBe('')
  })
})

describe('renderElementsList', () => {
  it('shows the dashboard and draft revision above one row per element', () => {
    const listed: DashboardElementsList = {
      dashboardId: 'dash-1',
      draftRevision: 7,
      elements: [
        { id: 'el1', kind: 'chart', title: 'Revenue', layout: { x: 0, y: 0, w: 6, h: 4 } },
        { id: 'el2', kind: 'filter', title: 'Region', layout: null, sqlReferences: ['{{ region }}'] },
      ],
    }
    const lines = renderElementsList(listed).split('\n')
    expect(lines.slice(0, 3)).toEqual(['dashboard: dash-1', 'draft revision: 7', ''])
    expect(lines[3]).toMatch(/^id\s+kind\s+title\s+layout\s*$/)
    expect(lines[5]).toMatch(/^el1\s+chart\s+Revenue\s+0,0,6,4\s*$/)
    expect(lines[6]).toMatch(/^el2\s+filter\s+Region\s*$/)
  })
})

describe('renderElement', () => {
  it('lists the key fields and only the settings the element has', () => {
    const result: DashboardElementResult = {
      dashboardId: 'dash-1',
      draftRevision: 3,
      element: {
        id: 'el2',
        kind: 'filter',
        title: 'Region',
        layout: null,
        filterType: 'single_select',
        options: ['EU', 'US'],
      },
    }
    const output = renderElement(result)
    expect(output).toMatch(/^draftRevision\s+3\s*$/m)
    expect(output).toMatch(/^kind\s+filter\s*$/m)
    expect(output).toMatch(/^filterType\s+single_select\s*$/m)
    expect(output).toContain('["EU","US"]')
    expect(output).not.toMatch(/^sql\s/m)
  })

  it('shows every other setting: known ones in order, then unknown keys alphabetically', () => {
    const element = {
      id: 'el3',
      kind: 'filter',
      title: 'Period',
      layout: null,
      zeta: 'z',
      alpha: { nested: true },
      chartConfig: { type: 'bar' },
      regex: '^[A-Z]+$',
      optionsQuery: 'select region from sales',
      defaultValue: { start: '2026-01-01', end: '2026-02-01' },
    } as DashboardElementResult['element']
    const lines = renderElement({ dashboardId: 'dash-1', draftRevision: 3, element }).split('\n')
    const fields = lines.slice(2).map((line) => line.split(/\s+/)[0])
    expect(fields).toEqual([
      'dashboardId',
      'draftRevision',
      'id',
      'kind',
      'title',
      'layout',
      'optionsQuery',
      'defaultValue',
      'regex',
      'chartConfig',
      'alpha',
      'zeta',
    ])
    const output = lines.join('\n')
    expect(output).toMatch(/^chartConfig\s+\{"type":"bar"\}\s*$/m)
    expect(output).toMatch(/^regex\s+\^\[A-Z\]\+\$\s*$/m)
    expect(output).toMatch(/^optionsQuery\s+select region from sales\s*$/m)
    expect(output).toMatch(/^defaultValue\s+\{"start":"2026-01-01","end":"2026-02-01"\}\s*$/m)
    expect(output).toMatch(/^alpha\s+\{"nested":true\}\s*$/m)
  })

  it('shows a null setting with a blank value', () => {
    const output = renderElement({
      dashboardId: 'dash-1',
      draftRevision: 3,
      element: { id: 'el4', kind: 'filter', title: 'Date', layout: null, defaultValue: null },
    })
    expect(output).toMatch(/^defaultValue\s*$/m)
  })
})

describe('renderDashboardsList', () => {
  it('shows one row per dashboard with its version and draft revision', () => {
    const lines = renderDashboardsList([dashboard()]).split('\n')
    expect(lines[0]).toMatch(/^id\s+title\s+view\s+version\s+draftRevision\s+visibility\s+updatedAt\s*$/)
    expect(lines[2]).toMatch(/^dash-1\s+Revenue\s+active\s+2\s+5\s+private\s+2026-09-16T10:00:00.000Z\s*$/)
  })

  it('says so when there are no dashboards', () => {
    expect(renderDashboardsList([])).toBe('(no results)')
  })
})

describe('renderDashboard', () => {
  it('shows the dashboard fields, then every tile and filter with its grid position', () => {
    const output = renderDashboard(
      dashboard({
        pendingOwnershipTransfer: {
          pendingOwnerUserId: 'user_next',
          requestedByUserId: 'user_owner',
          requestedAt: '2026-09-16T10:00:00.000Z',
        },
      }),
    )
    expect(output).toMatch(/^title\s+Revenue\s*$/m)
    expect(output).toMatch(/^version\s+2\s*$/m)
    expect(output).toMatch(/^draftRevision\s+5\s*$/m)
    expect(output).toMatch(/^owner\s+owner@example.com\s*$/m)
    expect(output).toMatch(/^pendingOwner\s+user_next\s*$/m)
    expect(output).toMatch(/^t1\s+table\s+By region\s+0,0,12,4\s*$/m)
    expect(output).toMatch(/^region\s+filter\s+Region\s*$/m)
  })

  it('shows a blank version for the draft and no rows for an empty definition', () => {
    const base = dashboard()
    const output = renderDashboard(
      dashboard({
        view: 'draft',
        selectedVersion: { ...base.selectedVersion, id: null, versionNumber: null },
        definition: { tiles: [], filters: [] },
      }),
    )
    expect(output).toMatch(/^version\s*$/m)
    expect(output).toMatch(/^view\s+draft\s*$/m)
    expect(output).toContain('(no results)')
  })
})

describe('renderVersionsList', () => {
  it('shows one row per version', () => {
    const version = {
      uid: 'ver-2',
      dashboardUid: 'dash-1',
      versionNumber: 2,
      kind: 'published',
      title: 'Revenue',
      description: '',
      access,
      definition: {},
      createdByUserId: 'user_owner',
      createdAt: '2026-09-16T10:00:00.000Z',
    } as DashboardVersion
    const lines = renderVersionsList([version]).split('\n')
    expect(lines[0]).toMatch(/^uid\s+versionNumber\s+kind\s+title\s+createdByUserId\s+createdAt\s*$/)
    expect(lines[2]).toMatch(/^ver-2\s+2\s+published\s+Revenue\s+user_owner\s+2026-09-16T10:00:00.000Z\s*$/)
  })
})

describe('renderDraftSnapshots', () => {
  it('shows one row per snapshot', () => {
    const snapshot: DashboardDraftSnapshot = {
      uid: 'snap-1',
      createdByUserId: 'user_owner',
      createdAt: '2026-09-16T10:00:00.000Z',
    }
    const lines = renderDraftSnapshots([snapshot]).split('\n')
    expect(lines[0]).toMatch(/^uid\s+createdByUserId\s+createdAt\s*$/)
    expect(lines[2]).toMatch(/^snap-1\s+user_owner\s+2026-09-16T10:00:00.000Z\s*$/)
  })
})
