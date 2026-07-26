import { describe, expect, it } from 'vitest'
import { renderTable } from '../../src/output.js'

describe('renderTable', () => {
  it('renders a header, separator, and one row per item', () => {
    const table = renderTable([{ id: 1, name: 'Alpha' }, { id: 22, name: 'Beta' }], ['id', 'name'])
    const lines = table.split('\n')
    expect(lines).toHaveLength(4)
    expect(lines[0]).toBe('id  name ')
    expect(lines[2]).toBe('1   Alpha')
    expect(lines[3]).toBe('22  Beta ')
  })

  it('reports no results for an empty list', () => {
    expect(renderTable([], ['id'])).toBe('(no results)')
  })

  it('stringifies nested objects/arrays as compact JSON', () => {
    const table = renderTable([{ id: 1, tags: ['a', 'b'] }], ['id', 'tags'])
    expect(table).toContain('["a","b"]')
  })
})
