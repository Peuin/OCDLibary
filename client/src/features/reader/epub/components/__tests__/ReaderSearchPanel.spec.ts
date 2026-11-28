import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ReaderSearchPanel from '../ReaderSearchPanel.vue'
import { MIN_SEARCH_QUERY_LENGTH } from '../../composables/useSearch'

const dynamicScrollerStub = {
  props: ['items'],
  template:
    '<div data-testid="epub-search-results"><template v-for="(item, index) in items" :key="item.id"><slot :item="item" :index="index" :active="true" /></template></div>',
}

const globalStubs = {
  stubs: {
    DynamicScroller: dynamicScrollerStub,
    DynamicScrollerItem: { template: '<div><slot /></div>' },
    ReaderBottomSheet: { template: '<div data-testid="epub-search-sheet"><slot /></div>' },
  },
}

function mountPanel(props: Record<string, unknown> = {}) {
  return mount(ReaderSearchPanel, {
    props: {
      results: [],
      isSearching: false,
      ...props,
    },
    global: globalStubs,
  })
}

const result = {
  cfi: 'epubcfi(/6/4)',
  sectionTitle: 'Chapter 1',
  excerpt: { pre: 'A ', match: 'dragon', post: ' appears' },
}

describe('ReaderSearchPanel', () => {
  it('debounces search input and emits trimmed query', async () => {
    vi.useFakeTimers()
    const wrapper = mountPanel()

    await wrapper.get('input').setValue('  dragons  ')
    vi.advanceTimersByTime(599)
    expect(wrapper.emitted('search')).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(wrapper.emitted('search')?.[0]).toEqual(['dragons'])

    vi.useRealTimers()
  })

  it('requires minimum query length before searching', async () => {
    vi.useFakeTimers()
    const wrapper = mountPanel()

    await wrapper.get('input').setValue('x'.repeat(MIN_SEARCH_QUERY_LENGTH - 1))
    vi.advanceTimersByTime(700)

    expect(wrapper.emitted('search')).toBeUndefined()
    expect(wrapper.emitted('clear')?.length).toBe(1)
    expect(wrapper.text()).toContain(`Type at least ${MIN_SEARCH_QUERY_LENGTH} characters`)
    vi.useRealTimers()
  })

  it('emits clear when input becomes empty and when clear button is clicked', async () => {
    const wrapper = mountPanel()

    await wrapper.get('input').setValue('abc')
    await wrapper.get('input').setValue('')
    expect(wrapper.emitted('clear')?.length).toBe(1)

    await wrapper.get('input').setValue('again')
    await wrapper.get('button[class*="size-6"]').trigger('click')
    expect(wrapper.emitted('clear')?.length).toBe(3)
  })

  it('renders the dock on the left without a dismissal overlay', () => {
    const wrapper = mountPanel({ layout: 'dock' })
    const dock = wrapper.get('[data-testid="epub-search-dock"]')

    expect(dock.classes()).toContain('left-0')
    expect(dock.classes()).toContain('w-80')
    expect(wrapper.find('.fixed.inset-0').exists()).toBe(false)
  })

  it('uses the bottom-sheet layout on mobile', () => {
    const wrapper = mountPanel({ layout: 'sheet' })

    expect(wrapper.find('[data-testid="epub-search-dock"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="epub-search-sheet"]').exists()).toBe(true)
  })

  it('emits navigate and close actions from UI interactions', async () => {
    const wrapper = mountPanel({ initialQuery: 'dragons', results: [result] })

    await wrapper.get('[data-testid="epub-search-result"]').trigger('click')
    expect(wrapper.emitted('navigate')?.[0]).toEqual(['epubcfi(/6/4)'])

    await wrapper.get('button.viewer-btn').trigger('click')
    expect(wrapper.emitted('close')?.length).toBe(1)
  })

  it('does not emit navigate when navigation is locked', async () => {
    const wrapper = mountPanel({ initialQuery: 'dragons', navigationLocked: true, results: [result] })

    await wrapper.get('[data-testid="epub-search-result"]').trigger('click')
    expect(wrapper.emitted('navigate')).toBeUndefined()
  })
})
