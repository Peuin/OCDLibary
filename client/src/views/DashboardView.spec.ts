import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount, type VueWrapper } from '@vue/test-utils'
import { ref, type Ref } from 'vue'
import type { DashboardFeaturedShelf, Library } from '@bookorbit/types'

import DashboardView from './DashboardView.vue'
import DashboardScroller from '@/features/dashboard/components/DashboardScroller.vue'
import DashboardSettingsSheet from '@/features/dashboard/components/DashboardSettingsSheet.vue'
import DashboardWelcome from '@/features/dashboard/components/DashboardWelcome.vue'
import DashboardWidgetRow from '@/features/dashboard/components/DashboardWidgetRow.vue'

const mocks = vi.hoisted(() => ({
  user: null as unknown as Ref<{ username: string; name: string; settings: Record<string, unknown> }>,
  libraries: null as unknown as Ref<Library[]>,
  librariesLoading: null as unknown as Ref<boolean>,
  librariesLoaded: null as unknown as Ref<boolean>,
  librariesError: null as unknown as Ref<string | null>,
  fetchLibraries: vi.fn<() => Promise<void>>(),
  shelves: null as unknown as Ref<DashboardFeaturedShelf[]>,
  sharedLoaded: null as unknown as Ref<boolean>,
  shelfLayout: null as unknown as Ref<string>,
  maybeStartTour: vi.fn<() => void>(),
}))

vi.mock('@/features/auth/composables/useAuth', () => ({
  useAuth: () => ({ user: mocks.user }),
}))

vi.mock('@/features/auth/composables/usePermissions', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}))

vi.mock('@/features/library/composables/useLibraries', () => ({
  useLibraries: () => ({
    libraries: mocks.libraries,
    loading: mocks.librariesLoading,
    loaded: mocks.librariesLoaded,
    error: mocks.librariesError,
    fetchLibraries: mocks.fetchLibraries,
  }),
}))

vi.mock('@/features/dashboard/composables/useDashboardConfig', () => ({
  SHELF_LAYOUT: { WIDE: 'wide', TWO_COLUMNS: 'two-columns' },
  useDashboardConfig: () => ({
    shelfLayout: mocks.shelfLayout,
    applySharedConfig: vi.fn<() => void>(),
  }),
}))

vi.mock('@/features/dashboard/composables/useDashboardSharedConfig', () => ({
  useDashboardSharedConfig: () => ({
    featuredShelves: mocks.shelves,
    orderedShelves: mocks.shelves,
    defaultLayout: ref(null),
    loaded: mocks.sharedLoaded,
    load: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  }),
}))

vi.mock('@/features/onboarding/composables/useOnboardingTour', () => ({
  useOnboardingTour: () => ({ maybeStartTour: mocks.maybeStartTour }),
}))

function shelf(id: number, title: string): DashboardFeaturedShelf {
  return { id, title, saintName: null, imageUrl: null, rows: 1, displayOrder: id }
}

async function mountView(): Promise<VueWrapper> {
  const wrapper = shallowMount(DashboardView)
  await flushPromises()
  return wrapper
}

describe('DashboardView library loading states', () => {
  let wrapper: VueWrapper | null = null

  beforeEach(() => {
    vi.useFakeTimers()
    mocks.user = ref({ username: 'reader', name: 'Test Reader', settings: {} })
    mocks.libraries = ref([])
    mocks.librariesLoading = ref(false)
    mocks.librariesLoaded = ref(false)
    mocks.librariesError = ref(null)
    mocks.shelves = ref([])
    mocks.sharedLoaded = ref(true)
    mocks.shelfLayout = ref('wide')
    mocks.fetchLibraries.mockReset().mockResolvedValue()
    mocks.maybeStartTour.mockReset()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('shows a loading status until the first library request completes', async () => {
    wrapper = await mountView()

    expect(wrapper.get('[role="status"]').text()).toContain('Loading')
    expect(wrapper.findComponent(DashboardWelcome).exists()).toBe(false)
    expect(wrapper.findComponent(DashboardWidgetRow).exists()).toBe(false)
  })

  it('shows a retryable error instead of the empty-library welcome when the initial load fails', async () => {
    mocks.librariesError.value = 'HTTP 503'
    wrapper = await mountView()
    mocks.fetchLibraries.mockClear()

    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toContain('Unable to load your libraries')
    expect(alert.text()).toContain('Your library data has not been removed')
    expect(wrapper.findComponent(DashboardWelcome).exists()).toBe(false)
    expect(wrapper.findComponent(DashboardWidgetRow).exists()).toBe(false)

    await alert.get('button').trigger('click')

    expect(mocks.fetchLibraries).toHaveBeenCalledTimes(1)
  })

  it('renders the empty-library welcome only after a successful empty response', async () => {
    mocks.librariesLoaded.value = true
    wrapper = await mountView()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.getComponent(DashboardWelcome).props('canCreate')).toBe(true)
    expect(wrapper.findComponent(DashboardWidgetRow).exists()).toBe(false)
  })

  it('renders dashboard content when libraries have loaded', async () => {
    mocks.libraries.value = [{ id: 7 } as Library]
    mocks.librariesLoaded.value = true
    wrapper = await mountView()

    expect(wrapper.findComponent(DashboardWelcome).exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.findComponent(DashboardWidgetRow).exists()).toBe(true)
  })

  it('keeps dashboard content visible when a background refresh fails', async () => {
    mocks.libraries.value = [{ id: 7 } as Library]
    mocks.librariesLoaded.value = true
    mocks.librariesError.value = 'HTTP 504'
    wrapper = await mountView()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.findComponent(DashboardWidgetRow).exists()).toBe(true)
  })

  it('offers a labelled customize control beside the greeting that opens the settings sheet', async () => {
    mocks.libraries.value = [{ id: 7 } as Library]
    mocks.librariesLoaded.value = true
    wrapper = await mountView()

    // Named for assistive tech at every width, since the visible label is hidden below sm.
    const customizeButton = wrapper.findAll('button').find((button) => button.attributes('aria-label') === 'Customize dashboard')
    expect(customizeButton).toBeDefined()
    expect(customizeButton?.text()).toBe('Customize dashboard')

    await customizeButton?.trigger('click')

    expect(wrapper.findComponent(DashboardSettingsSheet).props('open')).toBe(true)
  })

  it('renders the shared shelves in order, each loading its own books', async () => {
    mocks.libraries.value = [{ id: 7 } as Library]
    mocks.librariesLoaded.value = true
    mocks.shelves.value = [shelf(4, 'Linh đạo Cát Minh'), shelf(9, 'Sách Thánh Gioan')]
    wrapper = await mountView()

    const rendered = wrapper.findAllComponents(DashboardScroller)
    expect(rendered.map((item) => [item.props('featuredShelfId'), item.props('title'), item.props('type')])).toEqual([
      [4, 'Linh đạo Cát Minh', 'featured-shelf'],
      [9, 'Sách Thánh Gioan', 'featured-shelf'],
    ])
  })

  it('pairs shelves in two columns and lets an odd last shelf take the full width', async () => {
    mocks.libraries.value = [{ id: 7 } as Library]
    mocks.librariesLoaded.value = true
    mocks.shelfLayout.value = 'two-columns'
    mocks.shelves.value = [shelf(1, 'A'), shelf(2, 'B'), shelf(3, 'C')]
    wrapper = await mountView()

    const rendered = wrapper.findAllComponents(DashboardScroller)
    expect(rendered.map((item) => item.classes().includes('xl:col-span-2'))).toEqual([false, false, true])
    expect(rendered[0]?.element.parentElement?.classList.contains('items-stretch')).toBe(true)
  })

  it('says when there are no shelves yet', async () => {
    mocks.libraries.value = [{ id: 7 } as Library]
    mocks.librariesLoaded.value = true
    wrapper = await mountView()

    expect(wrapper.findComponent(DashboardScroller).exists()).toBe(false)
    expect(wrapper.text()).toContain('No shelves yet.')
  })

  it('moves from the error state to dashboard content after a successful retry', async () => {
    mocks.librariesError.value = 'Network request failed'
    wrapper = await mountView()
    mocks.fetchLibraries.mockImplementationOnce(async () => {
      mocks.librariesLoading.value = true
      mocks.librariesError.value = null
      mocks.libraries.value = [{ id: 7 } as Library]
      mocks.librariesLoaded.value = true
      mocks.librariesLoading.value = false
    })

    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.findComponent(DashboardWidgetRow).exists()).toBe(true)
  })
})
