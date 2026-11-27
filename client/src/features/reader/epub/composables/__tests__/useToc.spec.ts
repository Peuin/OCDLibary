import { describe, expect, it } from 'vitest'
import { useToc } from '../useToc'

describe('useToc', () => {
  it('maps raw TOC items with label/title fallback and nested subitems', () => {
    const toc = useToc()

    toc.setChapters([
      {
        title: 'Part I',
        href: 'part1.xhtml',
        subitems: [
          { label: 'Chapter 1', href: 'ch1.xhtml#start' },
          { title: 'Chapter 2', href: 'ch2.xhtml' },
        ],
      },
      {
        href: 'untitled.xhtml',
      },
    ])

    expect(toc.chapters.value).toEqual([
      {
        label: 'Part I',
        href: 'part1.xhtml',
        subitems: [
          { label: 'Chapter 1', href: 'ch1.xhtml#start' },
          { label: 'Chapter 2', href: 'ch2.xhtml', subitems: undefined },
        ],
      },
      {
        label: '',
        href: 'untitled.xhtml',
        subitems: undefined,
      },
    ])
  })

  it('expands all ancestors of the active subitem without closing other branches', () => {
    const toc = useToc()
    toc.setChapters([{ href: 'part.xhtml', subitems: [{ href: 'ch.xhtml', subitems: [{ href: 'ch.xhtml#two' }] }] }])
    toc.toggleExpand('other.xhtml')
    toc.setActiveHref('ch.xhtml#two')
    expect([...toc.expandedHrefs.value]).toEqual(['other.xhtml', 'part.xhtml', 'ch.xhtml'])
    expect(toc.isActive('ch.xhtml#two')).toBe(true)
    expect(toc.isActive('ch.xhtml')).toBe(false)
  })

  it('expands a restored subitem when chapters arrive after the initial location', () => {
    const toc = useToc()
    toc.setActiveHref('chapter.xhtml#two')
    toc.setChapters([{ href: 'chapter.xhtml', subitems: [{ href: 'chapter.xhtml#two' }] }])
    expect(toc.isExpanded('chapter.xhtml')).toBe(true)
  })

  it('does not mark empty hrefs active', () => {
    expect(useToc().isActive('')).toBe(false)
  })

  it('toggles expanded hrefs immutably', () => {
    const toc = useToc()

    const before = toc.expandedHrefs.value
    toc.toggleExpand('ch1.xhtml')

    expect(toc.isExpanded('ch1.xhtml')).toBe(true)
    expect(toc.expandedHrefs.value).not.toBe(before)

    const expanded = toc.expandedHrefs.value
    toc.toggleExpand('ch1.xhtml')

    expect(toc.isExpanded('ch1.xhtml')).toBe(false)
    expect(toc.expandedHrefs.value).not.toBe(expanded)
  })

  it('matches only the active fragment within the chapter', () => {
    const toc = useToc()

    toc.setActiveHref('chapter-1.xhtml#frag-a')

    expect(toc.isActive('chapter-1.xhtml#frag-a')).toBe(true)
    expect(toc.isActive('chapter-1.xhtml#frag-b')).toBe(false)
    expect(toc.isActive('chapter-1.xhtml')).toBe(false)
    expect(toc.isActive('chapter-2.xhtml#frag-b')).toBe(false)
  })
})
