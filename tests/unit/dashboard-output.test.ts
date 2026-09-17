import type { DashboardElementResult, DashboardElementsList } from '@getmodus/sdk/management'
import { describe, expect, it } from 'vitest'
import { formatLayout, renderElement, renderElementsList } from '../../src/dashboard-output.js'

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
