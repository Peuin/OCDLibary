import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { Collection } from '@bookorbit/types'
import CollectionContextMenu from '../CollectionContextMenu.vue'

const ownerCollection = {
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

function mountMenu(collection: Collection | null = ownerCollection) {
  return mount(CollectionContextMenu, {
    props: { collection, position: { x: 100, y: 100 } },
    global: { stubs: { Teleport: true } },
  })
}

describe('CollectionContextMenu', () => {
  it('shows edit for the collection owner and emits the edit target', async () => {
    const wrapper = mountMenu()
    const edit = wrapper.get('[role="menuitem"]')

    expect(edit.text()).toContain('Edit collection')
    await edit.trigger('click')

    expect(wrapper.emitted('edit')).toEqual([[ownerCollection]])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('does not show an edit action for a non-owner', () => {
    const wrapper = mountMenu({ ...ownerCollection, isOwner: false })

    expect(wrapper.find('[role="menuitem"]').exists()).toBe(false)
  })

  it('closes on Escape', async () => {
    const wrapper = mountMenu()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes when clicking outside the menu', async () => {
    const wrapper = mountMenu()

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
