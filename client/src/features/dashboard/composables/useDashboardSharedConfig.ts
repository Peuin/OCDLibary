import { ref } from 'vue'

import type { DashboardDefaultLayout, DashboardFeaturedShelf, ScrollerType } from '@bookorbit/types'
import { fetchDashboardSharedConfig } from '../api/dashboard-featured-shelf.api'

// Module-level so the dashboard, its shelves and the settings sheet read one copy.
const featuredShelves = ref<DashboardFeaturedShelf[]>([])
const defaultLayout = ref<DashboardDefaultLayout | null>(null)
const loaded = ref(false)
let inflight: Promise<void> | null = null

export function useDashboardSharedConfig() {
  function load(): Promise<void> {
    inflight ??= fetchDashboardSharedConfig()
      .then((config) => {
        featuredShelves.value = config.featuredShelves
        defaultLayout.value = config.defaultLayout
        loaded.value = true
      })
      .catch(() => {
        // The dashboard still works from the user's own shelves when this fails.
        loaded.value = true
      })
      .finally(() => {
        inflight = null
      })
    return inflight
  }

  function featuredShelfById(id: number | undefined): DashboardFeaturedShelf | undefined {
    return id === undefined ? undefined : featuredShelves.value.find((shelf) => shelf.id === id)
  }

  function featuredShelfAttachedTo(type: ScrollerType): DashboardFeaturedShelf | undefined {
    return featuredShelves.value.find((shelf) => shelf.attachTo === type)
  }

  return { featuredShelves, defaultLayout, loaded, load, featuredShelfById, featuredShelfAttachedTo }
}
