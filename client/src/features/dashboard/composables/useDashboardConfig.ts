import { ref } from 'vue'

import { APP_FEATURES, SCROLLER_TYPES, type DashboardSharedConfig, type ScrollerConfig, type ScrollerType } from '@bookorbit/types'
import { normalizeShelfRows } from '../lib/shelf-rows'

const STORAGE_KEY = 'bookorbit:dashboard:config'
const MAX_SCROLLERS = 8

export const SHELF_LAYOUT = {
  WIDE: 'wide',
  TWO_COLUMNS: 'two-columns',
} as const

export type DashboardShelfLayout = (typeof SHELF_LAYOUT)[keyof typeof SHELF_LAYOUT]

interface StoredDashboardConfig {
  scrollers: ScrollerConfig[]
  shelfLayout: DashboardShelfLayout
}

const ALL_DEFAULT_SCROLLERS: ScrollerConfig[] = [
  { id: '2', type: 'recently-added', label: 'Recently Added', enabled: true, order: 1, limit: 20, rows: 1 },
  { id: '3', type: 'random', label: 'Discover Something New', enabled: true, order: 2, limit: 20, rows: 1 },
  { id: '1', type: 'continue-reading', label: 'Continue Reading', enabled: true, order: 3, limit: 20, rows: 1 },
  { id: '5', type: 'continue-listening', label: 'Continue Listening', enabled: true, order: 4, limit: 20, rows: 1 },
  { id: '7', type: 'continue-podcasts', label: 'Continue Podcasts', enabled: false, order: 5, limit: 20, rows: 1 },
  { id: '6', type: 'want-to-read', label: 'Want to Read', enabled: true, order: 6, limit: 20, rows: 1 },
  { id: '4', type: 'up-next-in-series', label: 'Up Next in Series', enabled: true, order: 7, limit: 20, rows: 1 },
]

export const DEFAULT_SHELF_LAYOUT: DashboardShelfLayout = SHELF_LAYOUT.TWO_COLUMNS

export const DEFAULT_SCROLLERS = ALL_DEFAULT_SCROLLERS.filter((scroller) => APP_FEATURES.podcasts || scroller.type !== 'continue-podcasts')

// Persisted-only. Shelf headings and the type selector resolve their text from the active
// locale via useDashboardLabels(); these values just keep stored configs shaped as before.
export const SCROLLER_LABELS: Record<ScrollerType, string> = {
  'continue-reading': 'Continue Reading',
  'continue-listening': 'Continue Listening',
  'continue-podcasts': 'Continue Podcasts',
  'want-to-read': 'Want to Read',
  'up-next-in-series': 'Up Next in Series',
  'recently-added': 'Recently Added',
  random: 'Discover Something New',
  'smart-scope': 'Smart Scope',
  'featured-shelf': 'Featured Shelf',
}

export const FEATURED_SHELF_TYPE = 'featured-shelf' satisfies ScrollerType

function featuredScrollerId(featuredShelfId: number): string {
  return `featured-${featuredShelfId}`
}

/** The next free numeric id. Featured shelves carry non-numeric ids, so they are skipped. */
export function nextScrollerId(list: readonly ScrollerConfig[]): string {
  const numericIds = list.map((scroller) => Number(scroller.id)).filter((id) => Number.isFinite(id))
  return String(Math.max(0, ...numericIds) + 1)
}

const VALID_SCROLLER_TYPES = new Set<ScrollerType>(SCROLLER_TYPES.filter((type) => APP_FEATURES.podcasts || type !== 'continue-podcasts'))

function cloneDefaultScrollers(): ScrollerConfig[] {
  return DEFAULT_SCROLLERS.map((scroller) => ({ ...scroller }))
}

function parseStoredScrollers(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return null

  const { scrollers } = value as { scrollers?: unknown }
  return Array.isArray(scrollers) ? scrollers : null
}

function normalizeShelfLayout(value: unknown): DashboardShelfLayout {
  return value === SHELF_LAYOUT.TWO_COLUMNS ? SHELF_LAYOUT.TWO_COLUMNS : SHELF_LAYOUT.WIDE
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function normalizePositiveNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return fallback
}

function normalizeSmartScopeId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return undefined
}

function normalizeId(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim().length > 0) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

function normalizeScroller(value: unknown, index: number): ScrollerConfig | null {
  if (!value || typeof value !== 'object') return null

  const raw = value as Partial<ScrollerConfig> & { type?: unknown }
  if (typeof raw.type !== 'string' || !VALID_SCROLLER_TYPES.has(raw.type as ScrollerType)) return null

  const type = raw.type as ScrollerType
  const label = typeof raw.label === 'string' && raw.label.trim().length > 0 ? raw.label.trim() : SCROLLER_LABELS[type]
  const smartScopeId = type === 'smart-scope' ? normalizeSmartScopeId(raw.smartScopeId) : undefined
  const featuredShelfId = type === FEATURED_SHELF_TYPE ? normalizeSmartScopeId(raw.featuredShelfId) : undefined
  if (type === FEATURED_SHELF_TYPE && featuredShelfId === undefined) return null

  return {
    id: normalizeId(raw.id, String(index + 1)),
    type,
    label,
    enabled: normalizeBoolean(raw.enabled, true),
    order: index + 1,
    limit: normalizePositiveNumber(raw.limit, 20),
    rows: normalizeShelfRows(raw.rows),
    ...(smartScopeId === undefined ? {} : { smartScopeId }),
    ...(featuredShelfId === undefined ? {} : { featuredShelfId }),
  }
}

function normalizeScrollers(value: unknown): ScrollerConfig[] {
  const storedScrollers = parseStoredScrollers(value)
  if (!storedScrollers) return cloneDefaultScrollers()

  // Featured shelves are the administrator's, so they do not use up the user's own shelf slots.
  let ownShelves = 0
  const normalized = storedScrollers
    .map((scroller, index) => normalizeScroller(scroller, index))
    .filter((scroller): scroller is ScrollerConfig => scroller !== null)
    .filter((scroller) => scroller.type === FEATURED_SHELF_TYPE || ++ownShelves <= MAX_SCROLLERS)
    .map((scroller, index) => ({ ...scroller, order: index + 1 }))

  return normalized.length > 0 ? normalized : cloneDefaultScrollers()
}

function loadConfig(): StoredDashboardConfig & { stored: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { scrollers: cloneDefaultScrollers(), shelfLayout: DEFAULT_SHELF_LAYOUT, stored: false }

    const parsed: unknown = JSON.parse(raw)
    const shelfLayout =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? normalizeShelfLayout((parsed as { shelfLayout?: unknown }).shelfLayout)
        : SHELF_LAYOUT.WIDE

    return { scrollers: normalizeScrollers(parsed), shelfLayout, stored: true }
  } catch {
    return { scrollers: cloneDefaultScrollers(), shelfLayout: DEFAULT_SHELF_LAYOUT, stored: false }
  }
}

function areScrollersEqual(left: ScrollerConfig[], right: ScrollerConfig[]): boolean {
  if (left.length !== right.length) return false
  return left.every((scroller, index) => {
    const other = right[index]
    if (!other) return false
    return (
      scroller.id === other.id &&
      scroller.type === other.type &&
      scroller.label === other.label &&
      scroller.enabled === other.enabled &&
      scroller.order === other.order &&
      scroller.limit === other.limit &&
      scroller.rows === other.rows &&
      scroller.smartScopeId === other.smartScopeId &&
      scroller.featuredShelfId === other.featuredShelfId
    )
  })
}

// Module-level singletons - all callers share the same reactive state
const initialConfig = loadConfig()
const scrollers = ref<ScrollerConfig[]>(initialConfig.scrollers)
const shelfLayout = ref<DashboardShelfLayout>(initialConfig.shelfLayout)
// A user who never saved follows the administrator's default, so it is not copied to storage.
let hasStoredConfig = initialConfig.stored
let sharedConfig: DashboardSharedConfig | null = null

/**
 * Brings the administrator's featured shelves into a shelf list: shelves that were removed or went
 * private drop out, titles follow the administrator's edits, and new ones join at the top so a
 * freshly pinned collection is seen. A shelf the user switched off stays off.
 */
export function reconcileFeaturedShelves(list: readonly ScrollerConfig[], shared: DashboardSharedConfig): ScrollerConfig[] {
  // Entries attached to a built-in shelf decorate that shelf rather than adding one of their own.
  const standalone = shared.featuredShelves.filter((shelf) => !shelf.attachTo)
  const shelvesById = new Map(standalone.map((shelf) => [shelf.id, shelf]))
  const kept = list
    .filter(
      (scroller) => scroller.type !== FEATURED_SHELF_TYPE || (scroller.featuredShelfId !== undefined && shelvesById.has(scroller.featuredShelfId)),
    )
    .map((scroller) => {
      const shelf = scroller.type === FEATURED_SHELF_TYPE ? shelvesById.get(scroller.featuredShelfId!) : undefined
      return shelf ? { ...scroller, label: shelf.title } : { ...scroller }
    })
  const present = new Set(kept.map((scroller) => scroller.featuredShelfId).filter((id): id is number => id !== undefined))
  const added: ScrollerConfig[] = standalone
    .filter((shelf) => !present.has(shelf.id))
    .map((shelf) => ({
      id: featuredScrollerId(shelf.id),
      type: FEATURED_SHELF_TYPE,
      label: shelf.title,
      enabled: true,
      order: 0,
      limit: 20,
      rows: 1,
      featuredShelfId: shelf.id,
    }))
  return [...added, ...kept].map((scroller, index) => ({ ...scroller, order: index + 1 }))
}

function defaultConfig(): StoredDashboardConfig {
  const adminDefault = sharedConfig?.defaultLayout
  if (adminDefault) {
    return { scrollers: normalizeScrollers(adminDefault.scrollers), shelfLayout: normalizeShelfLayout(adminDefault.shelfLayout) }
  }
  return { scrollers: cloneDefaultScrollers(), shelfLayout: DEFAULT_SHELF_LAYOUT }
}

function withFeaturedShelves(list: ScrollerConfig[]): ScrollerConfig[] {
  return sharedConfig ? normalizeScrollers(reconcileFeaturedShelves(list, sharedConfig)) : list
}

export function useDashboardConfig() {
  function save() {
    hasStoredConfig = true
    scrollers.value = normalizeScrollers(scrollers.value)
    shelfLayout.value = normalizeShelfLayout(shelfLayout.value)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        scrollers: scrollers.value,
        shelfLayout: shelfLayout.value,
      } satisfies StoredDashboardConfig),
    )
  }

  function saveScrollers(newScrollers: ScrollerConfig[]) {
    scrollers.value = normalizeScrollers(newScrollers)
    save()
  }

  function saveShelfSettings(newScrollers: ScrollerConfig[], newShelfLayout: DashboardShelfLayout) {
    scrollers.value = normalizeScrollers(newScrollers)
    shelfLayout.value = normalizeShelfLayout(newShelfLayout)
    save()
  }

  function addScroller(type: ScrollerType) {
    scrollers.value = normalizeScrollers(scrollers.value)
    if (scrollers.value.length >= MAX_SCROLLERS) return
    scrollers.value.push({
      id: nextScrollerId(scrollers.value),
      type,
      label: SCROLLER_LABELS[type],
      enabled: true,
      order: scrollers.value.length + 1,
      limit: 20,
      rows: 1,
    })
    save()
  }

  function pruneDeletedSmartScopeScrollers(validSmartScopeIds: readonly number[]) {
    const validIds = new Set(validSmartScopeIds.filter((id) => Number.isFinite(id) && id > 0))
    const next = scrollers.value
      .filter((scroller) => {
        if (scroller.type !== 'smart-scope') return true
        if (!scroller.smartScopeId) return false
        return validIds.has(scroller.smartScopeId)
      })
      .map((scroller, index) => ({ ...scroller, order: index + 1 }))

    if (areScrollersEqual(scrollers.value, next)) return
    scrollers.value = next
    save()
  }

  function reset() {
    const defaults = defaultConfig()
    scrollers.value = withFeaturedShelves(defaults.scrollers)
    shelfLayout.value = defaults.shelfLayout
    hasStoredConfig = false
    localStorage.removeItem(STORAGE_KEY)
  }

  /** The shelves a user gets from "Reset to defaults", with the current featured shelves in place. */
  function defaultShelfSettings(): StoredDashboardConfig {
    const defaults = defaultConfig()
    return { scrollers: withFeaturedShelves(defaults.scrollers), shelfLayout: defaults.shelfLayout }
  }

  function applySharedConfig(shared: DashboardSharedConfig) {
    sharedConfig = shared
    if (!hasStoredConfig) {
      const defaults = defaultConfig()
      scrollers.value = withFeaturedShelves(defaults.scrollers)
      shelfLayout.value = defaults.shelfLayout
      return
    }
    const next = withFeaturedShelves(scrollers.value)
    if (areScrollersEqual(scrollers.value, next)) return
    scrollers.value = next
    save()
  }

  return {
    scrollers,
    shelfLayout,
    saveScrollers,
    saveShelfSettings,
    addScroller,
    pruneDeletedSmartScopeScrollers,
    reset,
    defaultShelfSettings,
    applySharedConfig,
    MAX_SCROLLERS,
  }
}
