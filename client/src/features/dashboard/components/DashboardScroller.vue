<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import { useI18n } from 'vue-i18n'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { toast } from 'vue-sonner'
import {
  Aperture,
  BookMarked,
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  Headphones,
  LibraryBig,
  ListOrdered,
  Plus,
  RefreshCw,
  Shuffle,
  Sparkles,
} from '@lucide/vue'

import type { BookCard, BookScrollerType, DashboardFeaturedShelf } from '@bookorbit/types'
import { usePermissions } from '@/features/auth/composables/usePermissions'
import DashboardShelfBookPicker from './DashboardShelfBookPicker.vue'
import DashboardShelfDialog from './DashboardShelfDialog.vue'
import DashboardShelfRows, { type ShelfBookAction } from './DashboardShelfRows.vue'
import BookQuickView from '@/features/book/components/BookQuickView.vue'
import AddToCollectionSheet from '@/features/collection/components/AddToCollectionSheet.vue'
import DeleteBookDialog from '@/features/book/components/DeleteBookDialog.vue'
import { useDashboardScroller } from '../composables/useDashboardScroller'
import { removeDashboardShelfBook } from '../api/dashboard-featured-shelf.api'
import { useDeleteBook } from '@/features/book/composables/useDeleteBook'
import { MIN_SHELF_ROWS, chunkIntoBands, effectiveShelfRows, shelfBookLimit } from '../lib/shelf-rows'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  type: BookScrollerType
  title: string
  limit?: number
  rows?: number
  smartScopeId?: number
  /** The administrator's dashboard shelf this scroller shows, when `type` is `featured-shelf`. */
  featuredShelfId?: number
  /** The saint card an administrator set to lead this shelf. */
  featured?: Pick<DashboardFeaturedShelf, 'saintName' | 'imageUrl'> | null
}>()

const attrs = useAttrs()
const { t } = useI18n()

const DEFAULT_BOOKS_PER_ROW = 20

const { sm } = useBreakpoints(breakpointsTailwind)
const shelfRows = computed(() => effectiveShelfRows(props.rows ?? MIN_SHELF_ROWS, !sm.value))

// Snapshotted at setup so resizing across the breakpoint re-flows the books
// already fetched instead of firing another batch request.
const { books, loading, error, refresh } = useDashboardScroller(
  props.type,
  shelfBookLimit(props.limit ?? DEFAULT_BOOKS_PER_ROW, shelfRows.value),
  props.smartScopeId,
  props.featuredShelfId,
)

const showSaintCard = computed(() => Boolean(props.featured && (props.featured.saintName || props.featured.imageUrl)))

// The dashboard shows every shelf as a single row; the configured rows lay out the full shelf in "view all".
const homeBands = computed(() => (books.value.length > 0 ? [books.value] : []))
const bands = computed(() => chunkIntoBands(books.value, shelfRows.value))

const viewAllOpen = ref(false)

const rowsRef = ref<InstanceType<typeof DashboardShelfRows> | null>(null)

function scrollBy(delta: number) {
  rowsRef.value?.scrollBy(delta)
}

function handleScrollBack() {
  scrollBy(-560)
}

function handleScrollForward() {
  scrollBy(560)
}

function handleViewAll() {
  viewAllOpen.value = true
}

// A dashboard shelf holds only the books an administrator added, and they add or remove them here.
const { hasPermission } = usePermissions()
const curatableShelfId = computed(() =>
  props.type === 'featured-shelf' && props.featuredShelfId !== undefined && hasPermission('manage_app_settings') ? props.featuredShelfId : null,
)
const shelvedBookIds = computed(() => books.value.map((book) => book.id))
const pickerOpen = ref(false)

function handleOpenPicker() {
  pickerOpen.value = true
}

async function handleBooksAdded() {
  await refresh()
}

async function handleRemoveFromShelf(book: BookCard) {
  if (curatableShelfId.value === null) return
  try {
    await removeDashboardShelfBook(curatableShelfId.value, book.id)
    books.value = books.value.filter((item) => item.id !== book.id)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('dashboard.featured.errors.generic'))
  }
}

const typeIcon = computed(() => {
  if (props.type === 'continue-reading') return BookMarked
  if (props.type === 'continue-listening') return Headphones
  if (props.type === 'want-to-read') return BookmarkPlus
  if (props.type === 'up-next-in-series') return ListOrdered
  if (props.type === 'recently-added') return Sparkles
  if (props.type === 'smart-scope') return Aperture
  if (props.type === 'featured-shelf') return LibraryBig
  return Shuffle
})

const SKELETON_COUNT = 8
const skeletons = Array.from({ length: SKELETON_COUNT })
const skeletonWidthClass = computed(() => (showSaintCard.value ? 'w-[200px]' : 'w-[120px]'))

const quickViewBookId = ref<number | null>(null)
const quickViewOpen = ref(false)

const addToCollectionOpen = ref(false)
const addToCollectionBookId = ref<number | null>(null)

const {
  pendingId: deleteBookId,
  deleting: deletingBook,
  promptDelete,
  cancelDelete,
  confirmDelete,
} = useDeleteBook((id) => {
  books.value = books.value.filter((b) => b.id !== id)
})

// 'move-to-library' is part of the shared card contract; this view does not
// opt in, so it never fires here.
function handleBookAction(book: BookCard, action: ShelfBookAction) {
  if (action === 'quick-view') {
    quickViewBookId.value = book.id
    quickViewOpen.value = true
    return
  }
  if (action === 'add-to-collection') {
    addToCollectionBookId.value = book.id
    addToCollectionOpen.value = true
    return
  }
  if (action === 'delete') {
    promptDelete(book.id)
  }
}
</script>

<template>
  <section
    v-bind="attrs"
    class="group/scroller flex h-full flex-col overflow-hidden rounded-2xl border border-primary/40 bg-card/30 shadow-sm backdrop-blur-[1px]"
  >
    <!-- Header -->
    <div class="mb-2 flex items-center justify-between px-5 pt-4">
      <div class="flex items-center gap-2.5">
        <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
          <component :is="typeIcon" :size="14" class="text-foreground" />
        </div>
        <h2 class="text-[15px] font-bold tracking-tight">{{ title }}</h2>
        <span
          v-if="!loading && !error && books.length > 0"
          class="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-bold tabular-nums text-foreground"
        >
          {{ books.length }}
        </span>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <div class="hidden items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover/scroller:opacity-100 sm:flex">
          <button
            type="button"
            :aria-label="t('common.previous')"
            class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            @click="handleScrollBack"
          >
            <ChevronLeft :size="16" />
          </button>
          <button
            type="button"
            :aria-label="t('common.next')"
            class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            @click="handleScrollForward"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
        <button
          v-if="curatableShelfId !== null"
          type="button"
          data-testid="shelf-add-books"
          class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :aria-label="t('dashboard.shelfBooks.addToShelf')"
          :title="t('dashboard.shelfBooks.addToShelf')"
          @click="handleOpenPicker"
        >
          <Plus :size="16" />
        </button>
        <button
          v-if="!loading && !error && books.length > 0"
          type="button"
          data-testid="shelf-view-all"
          class="rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-muted hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          @click="handleViewAll"
        >
          {{ t('dashboard.scroller.viewAll') }}
        </button>
      </div>
    </div>

    <!-- Pushed to the bottom so the ledges of two shelves side by side line up. -->
    <DashboardShelfRows
      ref="rowsRef"
      class="mt-auto"
      :bands="loading || error ? [] : homeBands"
      :featured="featured"
      :show-saint-card="showSaintCard"
      saint-action
      :removable="curatableShelfId !== null"
      @action="handleBookAction"
      @view-all="handleViewAll"
      @remove="handleRemoveFromShelf"
    >
      <template #empty>
        <!-- Skeleton -->
        <div v-if="loading" class="flex gap-3 overflow-hidden pb-3">
          <div v-for="(_, n) in skeletons" :key="n" class="shrink-0" :class="skeletonWidthClass">
            <div class="w-full animate-pulse rounded-lg bg-muted" style="aspect-ratio: 2/3" />
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex w-full items-center gap-2.5 pb-4 pt-1 text-sm text-muted-foreground">
          <span>{{ t('dashboard.scroller.failedToLoad') }}</span>
          <button class="flex items-center gap-1.5 text-xs text-primary hover:underline" @click="refresh">
            <RefreshCw :size="12" />
            {{ t('dashboard.common.retry') }}
          </button>
        </div>

        <!-- Empty: an administrator can fill the shelf from here -->
        <div v-else-if="curatableShelfId !== null" class="flex w-full animate-fade-up flex-col items-center justify-center gap-3 py-10 text-center">
          <button
            type="button"
            data-testid="shelf-empty-add"
            class="inline-flex h-8 items-center gap-1.5 rounded-md border border-primary/40 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            @click="handleOpenPicker"
          >
            <Plus :size="16" aria-hidden="true" />
            {{ t('dashboard.shelfBooks.addToShelf') }}
          </button>
        </div>

        <!-- Empty -->
        <div v-else class="flex w-full animate-fade-up flex-col items-center justify-center gap-3 py-10 text-center">
          <div class="flex h-12 w-12 animate-scale-in items-center justify-center rounded-full bg-muted">
            <component :is="typeIcon" :size="20" class="text-muted-foreground" />
          </div>
          <p class="text-sm text-muted-foreground">
            <template v-if="type === 'continue-reading'">{{ t('dashboard.scroller.empty.continueReading') }}</template>
            <template v-else-if="type === 'continue-listening'">{{ t('dashboard.scroller.empty.continueListening') }}</template>
            <template v-else-if="type === 'want-to-read'">{{ t('dashboard.scroller.empty.wantToRead') }}</template>
            <template v-else-if="type === 'up-next-in-series'">{{ t('dashboard.scroller.empty.upNextInSeries') }}</template>
            <template v-else-if="type === 'recently-added'">{{ t('dashboard.scroller.empty.recentlyAdded') }}</template>
            <template v-else-if="type === 'smart-scope'">{{ t('dashboard.scroller.empty.smartScope') }}</template>
            <template v-else-if="type === 'featured-shelf'">{{ t('dashboard.scroller.empty.shelf') }}</template>
            <template v-else>{{ t('dashboard.scroller.empty.default') }}</template>
          </p>
        </div>
      </template>
    </DashboardShelfRows>
  </section>

  <DashboardShelfDialog
    v-model:open="viewAllOpen"
    :title="title"
    :icon="typeIcon"
    :count="books.length"
    :bands="bands"
    :featured="featured"
    :show-saint-card="showSaintCard"
    :removable="curatableShelfId !== null"
    @action="handleBookAction"
    @remove="handleRemoveFromShelf"
  />

  <DashboardShelfBookPicker
    v-if="curatableShelfId !== null"
    v-model:open="pickerOpen"
    :title="title"
    :shelf-id="curatableShelfId"
    :shelved-book-ids="shelvedBookIds"
    @added="handleBooksAdded"
  />

  <BookQuickView :book-id="quickViewBookId" :open="quickViewOpen" @update:open="quickViewOpen = $event" />

  <AddToCollectionSheet
    :open="addToCollectionOpen"
    :selection-payload="{ bookIds: addToCollectionBookId ? [addToCollectionBookId] : [] }"
    :selected-count="addToCollectionBookId ? 1 : 0"
    @update:open="addToCollectionOpen = $event"
  />

  <DeleteBookDialog :open="deleteBookId !== null" :deleting="deletingBook" @confirm="confirmDelete" @cancel="cancelDelete" />
</template>
