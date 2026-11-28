import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PdfSearchPanel from '../components/PdfSearchPanel.vue'

const state = vi.hoisted(() => ({
  searchAllPages: vi.fn<(keyword: string) => unknown>(),
  stopSearch: vi.fn<() => void>(),
  goToResult: vi.fn<(index: number) => number>(),
  setFlags: vi.fn<(flags: unknown[]) => void>(),
  searchState: {
    value: {
      query: '',
      flags: [] as unknown[],
      results: [] as unknown[],
      total: 0,
      activeResultIndex: -1,
      showAllResults: true,
      loading: false,
      active: false,
    },
  },
  scrollState: { value: { totalPages: 10 } },
  textForm: { value: 'NFC' as 'NFC' | 'NFD' },
  hasText: { value: true },
}))

vi.mock('@embedpdf/plugin-scroll/vue', () => ({
  useScroll: () => ({ state: state.scrollState, provides: { value: { scrollToPage: vi.fn<() => void>() } } }),
}))

vi.mock('@embedpdf/plugin-search/vue', () => ({
  useSearch: () => ({
    state: state.searchState,
    provides: {
      value: {
        searchAllPages: state.searchAllPages,
        stopSearch: state.stopSearch,
        goToResult: state.goToResult,
        setFlags: state.setFlags,
      },
    },
  }),
}))

vi.mock('../composables/usePdfTextForm', async () => {
  const { ref } = await import('vue')
  state.textForm = ref(state.textForm.value) as never
  state.hasText = ref(state.hasText.value) as never
  return {
    usePdfTextForm: () => ({ form: state.textForm, hasText: state.hasText, loading: ref(false) }),
  }
})

function taskWithTotal(total: number) {
  return {
    onProgress: vi.fn<(callback: (progress: { page: number }) => void) => void>(),
    toPromise: () => Promise.resolve({ results: [], total }),
  }
}

function mountPanel() {
  return mount(PdfSearchPanel, {
    props: { documentId: 'doc-1', active: true },
    global: {
      stubs: {
        DynamicScroller: true,
        DynamicScrollerItem: true,
      },
    },
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  state.searchAllPages.mockReset().mockImplementation(() => taskWithTotal(0))
  state.stopSearch.mockReset()
  state.textForm.value = 'NFC'
  state.hasText.value = true
})

afterEach(() => vi.useRealTimers())

describe('PdfSearchPanel unicode search', () => {
  it('normalizes an NFC query to NFD and retries once with NFC when the first search is empty', async () => {
    state.textForm.value = 'NFD'
    const wrapper = mountPanel()
    await wrapper.get('input').setValue('con tàu')
    await vi.advanceTimersByTimeAsync(250)
    await flushPromises()

    expect(state.searchAllPages).toHaveBeenNthCalledWith(1, 'con tàu')
    expect(state.searchAllPages).toHaveBeenNthCalledWith(2, 'con tàu')
    expect(state.searchAllPages).toHaveBeenCalledTimes(2)
  })

  it('does not retry when the preferred Unicode form has results', async () => {
    state.textForm.value = 'NFD'
    state.searchAllPages.mockImplementation(() => taskWithTotal(2))
    const wrapper = mountPanel()
    await wrapper.get('input').setValue('con tàu')
    await vi.advanceTimersByTimeAsync(250)
    await flushPromises()

    expect(state.searchAllPages).toHaveBeenCalledTimes(1)
    expect(state.searchAllPages).toHaveBeenCalledWith('con tàu')
  })

  it('shows the scanned-document explanation when the PDF has no text layer', async () => {
    state.hasText.value = false
    const wrapper = mountPanel()
    await wrapper.get('input').setValue('con tàu')
    await vi.advanceTimersByTimeAsync(250)
    await flushPromises()

    expect(wrapper.text()).toContain('This document is a scanned image and has no text to search. OCR is required.')
  })
})
