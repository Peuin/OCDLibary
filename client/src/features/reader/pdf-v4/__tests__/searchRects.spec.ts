import { describe, expect, it } from 'vitest'
import type { Rect } from '@embedpdf/models'
import { mergeLineRects } from '../utils/searchRects'

function rect(x: number, y: number, width: number, height = 12): Rect {
  return { origin: { x, y }, size: { width, height } }
}

describe('mergeLineRects', () => {
  it('merges adjacent fragments on the same line into one bounding rect', () => {
    expect(mergeLineRects([rect(20, 10, 15), rect(35, 10, 10), rect(45, 11, 18)])).toEqual([rect(20, 10, 43, 13)])
  })

  it('keeps separate lines as separate highlight blocks', () => {
    expect(mergeLineRects([rect(20, 10, 30), rect(20, 30, 35)])).toEqual([rect(20, 10, 30), rect(20, 30, 35)])
  })

  it('merges overlapping fragments without a darker overlap', () => {
    expect(mergeLineRects([rect(20, 10, 30), rect(40, 10, 20)])).toEqual([rect(20, 10, 40)])
  })

  it('does not merge distant words on the same line', () => {
    expect(mergeLineRects([rect(20, 10, 10), rect(50, 10, 10)])).toEqual([rect(20, 10, 10), rect(50, 10, 10)])
  })

  it('does not interleave fragments when a later line starts farther left', () => {
    expect(mergeLineRects([rect(100, 10, 20), rect(20, 30, 20), rect(20, 10, 20), rect(40, 10, 20), rect(60, 10, 20), rect(80, 10, 20)])).toEqual([
      rect(20, 10, 100),
      rect(20, 30, 20),
    ])
  })
})
