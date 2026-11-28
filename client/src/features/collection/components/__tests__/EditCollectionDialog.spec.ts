import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Collection } from '@bookorbit/types'
import EditCollectionDialog from '../EditCollectionDialog.vue'

const mocks = vi.hoisted(() => ({
  updateCollection: vi.fn<(id: number, name: string, icon: string, syncToKobo?: boolean, isPublic?: boolean) => Promise<Collection>>(),
  deleteCollection: vi.fn<(id: number) => Promise<void>>(),
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ replace: vi.fn<() => void>() }) }))

vi.mock('../../composables/useCollections', () => ({
  useCollections: () => ({ updateCollection: mocks.updateCollection, deleteCollection: mocks.deleteCollection }),
}))

const collection = {
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
} as Collection

function mountDialog() {
  return mount(EditCollectionDialog, {
    props: { open: true, collection },
    global: {
      stubs: {
        Teleport: true,
        IconPicker: true,
        ToggleSwitch: true,
      },
    },
  })
}

beforeEach(() => {
  mocks.updateCollection.mockReset().mockResolvedValue(collection)
  mocks.deleteCollection.mockReset().mockResolvedValue(undefined)
})

describe('EditCollectionDialog owner-only editing', () => {
  it('saves through the existing update path and closes on success', async () => {
    const wrapper = mountDialog()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(mocks.updateCollection).toHaveBeenCalledWith(7, 'Read later', 'Bookmark', false, false)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('shows an owner-specific message when the server rejects the save with 403', async () => {
    mocks.updateCollection.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }))
    const wrapper = mountDialog()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Only the collection owner can edit this collection')
    expect(wrapper.emitted('close')).toBeUndefined()
  })
})
