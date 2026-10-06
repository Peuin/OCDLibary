import { beforeEach, describe, expect, it, vi } from 'vitest'

const STORAGE_KEY = 'bookorbit:dashboard:config'

describe('useDashboardConfig', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  it('defaults to two columns', async () => {
    const { useDashboardConfig } = await import('../useDashboardConfig')

    expect(useDashboardConfig().shelfLayout.value).toBe('two-columns')
  })

  it('reads the layout from a stored config that still carries the old shelf list', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ scrollers: [{ id: '1', type: 'random' }], shelfLayout: 'wide' }))
    const { useDashboardConfig } = await import('../useDashboardConfig')

    expect(useDashboardConfig().shelfLayout.value).toBe('wide')
  })

  it('saves only the layout', async () => {
    const { useDashboardConfig } = await import('../useDashboardConfig')

    useDashboardConfig().saveShelfLayout('wide')

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({ shelfLayout: 'wide' })
  })

  it('follows the administrator default until the user saves their own', async () => {
    const { useDashboardConfig } = await import('../useDashboardConfig')
    const { shelfLayout, applySharedConfig, saveShelfLayout } = useDashboardConfig()

    applySharedConfig({ featuredShelves: [], defaultLayout: { shelfLayout: 'wide', scrollers: [] } })
    expect(shelfLayout.value).toBe('wide')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

    saveShelfLayout('two-columns')
    applySharedConfig({ featuredShelves: [], defaultLayout: { shelfLayout: 'wide', scrollers: [] } })
    expect(shelfLayout.value).toBe('two-columns')
  })
})
