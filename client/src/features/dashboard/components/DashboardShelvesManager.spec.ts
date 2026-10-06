import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { DashboardFeaturedShelf } from '@bookorbit/types'

const api = vi.hoisted(() => ({
  createFeaturedShelf: vi.fn<(body: { title: string }) => Promise<DashboardFeaturedShelf>>(),
  updateFeaturedShelf: vi.fn<(id: number, body: { title?: string; rows?: number }) => Promise<DashboardFeaturedShelf>>(),
  reorderFeaturedShelves: vi.fn<(ids: number[]) => Promise<DashboardFeaturedShelf[]>>(),
  deleteFeaturedShelf: vi.fn<(id: number) => Promise<void>>(),
}))

vi.mock('../api/dashboard-featured-shelf.api', () => api)
vi.mock('./DashboardSaintCardEditor.vue', () => ({ default: { name: 'DashboardSaintCardEditor', props: ['shelf'], template: '<div />' } }))

import DashboardShelvesManager from './DashboardShelvesManager.vue'
import { useDashboardSharedConfig } from '../composables/useDashboardSharedConfig'

function shelf(id: number, title: string, overrides: Partial<DashboardFeaturedShelf> = {}): DashboardFeaturedShelf {
  return { id, title, saintName: null, imageUrl: null, rows: 1, displayOrder: id, ...overrides }
}

function titles(wrapper: ReturnType<typeof mount>): string[] {
  return wrapper.findAll<HTMLInputElement>('[data-testid="shelf-title-input"]').map((input) => input.element.value)
}

describe('DashboardShelvesManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDashboardSharedConfig().replaceShelves([shelf(1, 'Linh đạo'), shelf(2, 'Sách Thánh Gioan')])
  })

  it('lists the shelves in order with their free-form names', () => {
    expect(titles(mount(DashboardShelvesManager))).toEqual(['Linh đạo', 'Sách Thánh Gioan'])
  })

  it('renames a shelf to whatever the administrator types', async () => {
    api.updateFeaturedShelf.mockResolvedValue(shelf(1, 'Kinh Thánh'))
    const wrapper = mount(DashboardShelvesManager)

    const input = wrapper.findAll('[data-testid="shelf-title-input"]')[0]!
    await input.setValue('  Kinh Thánh ')
    await input.trigger('change')
    await flushPromises()

    expect(api.updateFeaturedShelf).toHaveBeenCalledWith(1, { title: 'Kinh Thánh' })
    expect(titles(wrapper)).toEqual(['Kinh Thánh', 'Sách Thánh Gioan'])
  })

  it('keeps the old name when the field is cleared', async () => {
    const wrapper = mount(DashboardShelvesManager)
    const input = wrapper.findAll<HTMLInputElement>('[data-testid="shelf-title-input"]')[0]!
    await input.setValue('   ')
    await input.trigger('change')

    expect(api.updateFeaturedShelf).not.toHaveBeenCalled()
    expect(input.element.value).toBe('Linh đạo')
  })

  it('adds a new shelf with a default name', async () => {
    api.createFeaturedShelf.mockResolvedValue(shelf(3, 'New shelf', { displayOrder: 3 }))
    const wrapper = mount(DashboardShelvesManager)

    await wrapper.get('[data-testid="shelf-manager-add"]').trigger('click')
    await flushPromises()

    expect(api.createFeaturedShelf).toHaveBeenCalledWith({ title: 'New shelf' })
    expect(titles(wrapper)).toEqual(['Linh đạo', 'Sách Thánh Gioan', 'New shelf'])
  })

  it('saves a new order when a shelf moves down', async () => {
    api.reorderFeaturedShelves.mockResolvedValue([shelf(2, 'Sách Thánh Gioan', { displayOrder: 1 }), shelf(1, 'Linh đạo', { displayOrder: 2 })])
    const wrapper = mount(DashboardShelvesManager)

    const moveDown = wrapper.findAll('button').find((button) => button.attributes('aria-label') === 'Move down')
    await moveDown?.trigger('click')
    await flushPromises()

    expect(api.reorderFeaturedShelves).toHaveBeenCalledWith([2, 1])
    expect(titles(wrapper)).toEqual(['Sách Thánh Gioan', 'Linh đạo'])
  })

  it('deletes a shelf after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    api.deleteFeaturedShelf.mockResolvedValue(undefined)
    const wrapper = mount(DashboardShelvesManager)

    await wrapper
      .findAll('button')
      .find((button) => button.attributes('aria-label') === 'Delete shelf')
      ?.trigger('click')
    await flushPromises()

    expect(api.deleteFeaturedShelf).toHaveBeenCalledWith(1)
    expect(titles(wrapper)).toEqual(['Sách Thánh Gioan'])
  })
})
