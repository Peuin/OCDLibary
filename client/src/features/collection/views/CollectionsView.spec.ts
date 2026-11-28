import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Collection } from '@bookorbit/types'
import CollectionsView from './CollectionsView.vue'

const state = vi.hoisted(() => ({
  bookCollections: { value: [] as Collection[] },
  fetchCollections: vi.fn<() => Promise<void>>(),
}))

vi.mock('@/features/collection/composables/useCollections', () => ({
  useCollections: () => ({
    bookCollections: computed(() => state.bookCollections.value),
    loading: ref(false),
    fetchCollections: state.fetchCollections,
  }),
}))

function collection(overrides: Partial<Collection> = {}): Collection {
  return {
    id: 7,
    userId: 1,
    mediaType: 'books',
    name: 'Read later',
    icon: 'Bookmark',
    description: null,
    isPublic: false,
    isOwner: true,
    syncToKobo: false,
    displayOrder: 1,
    bookCount: 3,
    podcastCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Collection
}

function mountView() {
  return mount(CollectionsView, {
    global: {
      stubs: {
        Teleport: true,
        RouterLink: RouterLinkStub,
        CreateCollectionDialog: true,
        EditCollectionDialog: { template: '<div data-testid="edit-collection-dialog" />' },
      },
    },
  })
}

beforeEach(() => {
  state.bookCollections.value = [collection()]
  state.fetchCollections.mockReset().mockResolvedValue(undefined)
})

describe('CollectionsView collection context menu', () => {
  it('opens the existing edit dialog from the owner context menu', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('a').trigger('contextmenu', { clientX: 40, clientY: 50 })
    const edit = wrapper.get('[role="menuitem"]')
    expect(edit.text()).toContain('Edit collection')

    await edit.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="edit-collection-dialog"]').exists()).toBe(true)
    expect(wrapper.find('[role="menuitem"]').exists()).toBe(false)
  })

  it('does not show edit for a non-owner collection', async () => {
    state.bookCollections.value = [collection({ isOwner: false, userId: 99 })]
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('a').trigger('contextmenu', { clientX: 40, clientY: 50 })

    expect(wrapper.find('[role="menuitem"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Edit collection')
  })
})
