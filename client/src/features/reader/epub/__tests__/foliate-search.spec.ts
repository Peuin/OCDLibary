import { describe, expect, it } from 'vitest'

import { search } from '../../../../../public/assets/foliate/search.js'

const allResults = (strs: string[], query: string, options?: Parameters<typeof search>[2]) => Array.from(search(strs, query, options))

describe('foliate search diacritic folding', () => {
  it('finds Vietnamese text from a query typed without diacritics', () => {
    const strs = ['Y Vân là ông chủ của Ô Túc Khoa, một người quanh năm làm ăn xuyên quốc gia']
    const results = allResults(strs, 'mot nguoi')
    expect(results).toHaveLength(1)
    expect(results[0]?.excerpt.match).toBe('một người')
  })

  it('folds đ/Đ to d', () => {
    const results = allResults(['được Đừng có nhầm lẫn, đâu mới là điều'], 'duoc dung')
    expect(results).toHaveLength(1)
    expect(results[0]?.excerpt.match).toBe('được Đừng')
    expect(allResults(['đâu mới là điều'], 'dau')).toHaveLength(1)
  })

  it('matches accented queries against unaccented text too', () => {
    const results = allResults(['mot nguoi quanh nam'], 'một người')
    expect(results).toHaveLength(1)
    expect(results[0]?.excerpt.match).toBe('mot nguoi')
  })

  it('matches a word spanning text-node boundaries with correct range offsets', () => {
    const strs = ['một ngư', 'ời quanh năm']
    const results = allResults(strs, 'mot nguoi')
    expect(results).toHaveLength(1)
    expect(results[0]?.range).toEqual({ startIndex: 0, startOffset: 0, endIndex: 1, endOffset: 2 })
    expect(results[0]?.excerpt.match).toBe('một người')
  })

  it('matches canonically decomposed (NFD) text', () => {
    const text = 'một người quanh năm'
    const results = allResults([text.normalize('NFD')], 'mot nguoi')
    expect(results).toHaveLength(1)
    expect(results[0]?.excerpt.match.normalize('NFC')).toBe('một người')
  })

  it('is case-insensitive by default', () => {
    const results = allResults(['Một Người'], 'mot nguoi')
    expect(results).toHaveLength(1)
    expect(results[0]?.excerpt.match).toBe('Một Người')
  })

  it('returns nothing when the folded needle is absent', () => {
    expect(allResults(['một người quanh năm'], 'khong co')).toHaveLength(0)
  })

  it('keeps exact-match semantics for variant sensitivity', () => {
    expect(allResults(['một người'], 'mot nguoi', { sensitivity: 'variant' })).toHaveLength(0)
    const exact = allResults(['một người'], 'một người', { sensitivity: 'variant' })
    expect(exact).toHaveLength(1)
    expect(exact[0]?.excerpt.match).toBe('một người')
  })
})
