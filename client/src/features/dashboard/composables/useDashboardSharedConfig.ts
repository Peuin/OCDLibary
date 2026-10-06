import { computed, ref } from 'vue'

import type { DashboardDefaultLayout, DashboardFeaturedShelf } from '@bookorbit/types'
import { fetchDashboardSharedConfig } from '../api/dashboard-featured-shelf.api'

// Module-level so the dashboard, its shelves and the settings sheet read one copy.
const featuredShelves = ref<DashboardFeaturedShelf[]>([])
const defaultLayout = ref<DashboardDefaultLayout | null>(null)
const loaded = ref(false)
// Bumped per shelf when its books change outside the shelf itself, so the shelf on the dashboard reloads.
const shelfBookRevisions = ref<Record<number, number>>({})
let inflight: Promise<void> | null = null

const orderedShelves = computed(() => [...featuredShelves.value].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id))

export function useDashboardSharedConfig() {
  function load(): Promise<void> {
    inflight ??= fetchDashboardSharedConfig()
      .then((config) => {
        featuredShelves.value = config.featuredShelves
        defaultLayout.value = config.defaultLayout
        loaded.value = true
      })
      .catch(() => {
        // The dashboard still renders, without shelves, when this fails.
        loaded.value = true
      })
      .finally(() => {
        inflight = null
      })
    return inflight
  }

  // Shelf edits are saved on the spot, so the dashboard behind the settings sheet follows them at once.
  function upsertShelf(shelf: DashboardFeaturedShelf) {
    const others = featuredShelves.value.filter((item) => item.id !== shelf.id)
    featuredShelves.value = [...others, shelf]
  }

  function removeShelf(id: number) {
    featuredShelves.value = featuredShelves.value.filter((shelf) => shelf.id !== id)
  }

  function replaceShelves(shelves: DashboardFeaturedShelf[]) {
    featuredShelves.value = shelves
  }

  function markShelfBooksChanged(id: number) {
    shelfBookRevisions.value = { ...shelfBookRevisions.value, [id]: (shelfBookRevisions.value[id] ?? 0) + 1 }
  }

  function shelfBookRevision(id: number | undefined): number {
    return id === undefined ? 0 : (shelfBookRevisions.value[id] ?? 0)
  }

  return {
    featuredShelves,
    orderedShelves,
    defaultLayout,
    loaded,
    load,
    upsertShelf,
    removeShelf,
    replaceShelves,
    markShelfBooksChanged,
    shelfBookRevision,
  }
}
