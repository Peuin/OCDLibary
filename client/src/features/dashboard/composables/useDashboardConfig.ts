import { ref } from 'vue'

import type { DashboardSharedConfig } from '@bookorbit/types'

const STORAGE_KEY = 'bookorbit:dashboard:config'

export const SHELF_LAYOUT = {
  WIDE: 'wide',
  TWO_COLUMNS: 'two-columns',
} as const

export type DashboardShelfLayout = (typeof SHELF_LAYOUT)[keyof typeof SHELF_LAYOUT]

export const DEFAULT_SHELF_LAYOUT: DashboardShelfLayout = SHELF_LAYOUT.TWO_COLUMNS

function normalizeShelfLayout(value: unknown): DashboardShelfLayout {
  return value === SHELF_LAYOUT.TWO_COLUMNS ? SHELF_LAYOUT.TWO_COLUMNS : SHELF_LAYOUT.WIDE
}

// The shelves themselves are the administrator's and live on the server; each user keeps only
// how they are laid out. Older stored configs also carry a shelf list, which is ignored.
function loadShelfLayout(): { shelfLayout: DashboardShelfLayout; stored: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { shelfLayout: DEFAULT_SHELF_LAYOUT, stored: false }
    const parsed: unknown = JSON.parse(raw)
    const value = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as { shelfLayout?: unknown }).shelfLayout : undefined
    return { shelfLayout: normalizeShelfLayout(value), stored: true }
  } catch {
    return { shelfLayout: DEFAULT_SHELF_LAYOUT, stored: false }
  }
}

// Module-level singletons - all callers share the same reactive state
const initial = loadShelfLayout()
const shelfLayout = ref<DashboardShelfLayout>(initial.shelfLayout)
// A user who never saved follows the administrator's default, so it is not copied to storage.
let hasStoredLayout = initial.stored
let sharedConfig: DashboardSharedConfig | null = null

function defaultShelfLayout(): DashboardShelfLayout {
  const adminDefault = sharedConfig?.defaultLayout
  return adminDefault ? normalizeShelfLayout(adminDefault.shelfLayout) : DEFAULT_SHELF_LAYOUT
}

export function useDashboardConfig() {
  function saveShelfLayout(layout: DashboardShelfLayout) {
    shelfLayout.value = normalizeShelfLayout(layout)
    hasStoredLayout = true
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ shelfLayout: shelfLayout.value }))
  }

  function applySharedConfig(shared: DashboardSharedConfig) {
    sharedConfig = shared
    if (!hasStoredLayout) shelfLayout.value = defaultShelfLayout()
  }

  return { shelfLayout, saveShelfLayout, defaultShelfLayout, applySharedConfig }
}
