import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import PdfSearchHighlightLayer from '../components/PdfSearchHighlightLayer.vue'

function rect(x: number, y: number, width: number, height = 12) {
  return { origin: { x, y }, size: { width, height } }
}

const state = vi.hoisted(() => ({
  searchState: {
    value: {
      active: true,
      results: [] as Array<{ pageIndex: number; rects: ReturnType<typeof rect>[] }>,
      activeResultIndex: 0,
      showAllResults: true,
    },
  },
  documentState: { value: { scale: 2 } },
}))

vi.mock('@embedpdf/core/vue', () => ({
  useDocumentState: () => state.documentState,
}))

vi.mock('@embedpdf/plugin-search/vue', () => ({
  useSearch: () => ({ state: state.searchState }),
}))

describe('PdfSearchHighlightLayer', () => {
  it('renders one scaled block for contiguous same-line fragments', () => {
    state.searchState.value.results = [{ pageIndex: 0, rects: [rect(10, 20, 15), rect(25, 20, 20)] }]
    const wrapper = mount(PdfSearchHighlightLayer, { props: { documentId: 'doc-1', pageIndex: 0 } })
    const hits = wrapper.findAll('.pdf-search-hit')
    expect(hits).toHaveLength(1)
    expect(hits[0].attributes('style')).toContain('left: 20px')
    expect(hits[0].attributes('style')).toContain('width: 70px')
  })

  it('keeps separate lines as separate blocks and marks only the active result', () => {
    state.searchState.value.results = [
      { pageIndex: 0, rects: [rect(10, 20, 20), rect(10, 40, 20)] },
      { pageIndex: 0, rects: [rect(70, 20, 20)] },
    ]
    state.searchState.value.activeResultIndex = 1
    const wrapper = mount(PdfSearchHighlightLayer, { props: { documentId: 'doc-1', pageIndex: 0 } })
    const hits = wrapper.findAll('.pdf-search-hit')
    expect(hits).toHaveLength(3)
    expect(wrapper.findAll('.pdf-search-hit-active')).toHaveLength(1)
  })
})
