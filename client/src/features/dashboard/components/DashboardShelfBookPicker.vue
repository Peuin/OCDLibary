<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { Check, Loader2, Plus, Search, X } from '@lucide/vue'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'

import type { BookCard } from '@bookorbit/types'
import { useGlobalSearch } from '@/features/book/composables/useGlobalSearch'
import { useCoverVersions } from '@/features/book/composables/useCoverVersions'
import { addDashboardShelfBooks } from '../api/dashboard-featured-shelf.api'

const props = defineProps<{
  open: boolean
  title: string
  shelfId: number
  /** Books the shelf already shows, marked as added. */
  shelvedBookIds: number[]
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  added: []
}>()

const { t } = useI18n()
const { coverUrl } = useCoverVersions()

const query = ref('')
const { results, loading, loadingMore, settled, hasMore, loadMore, clear } = useGlobalSearch(query)
const addedIds = ref(new Set<number>())
const pendingId = ref<number | null>(null)

const shelvedIds = computed(() => new Set([...props.shelvedBookIds, ...addedIds.value]))
const showNoResults = computed(() => settled.value && !loading.value && query.value.trim().length >= 2 && results.value.length === 0)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) return
    query.value = ''
    clear()
    addedIds.value = new Set()
  },
)

function handleOpenChange(open: boolean) {
  emit('update:open', open)
}

function handleQueryInput(event: Event) {
  query.value = (event.target as HTMLInputElement).value
}

function handleLoadMore() {
  void loadMore()
}

function bookAuthors(book: BookCard): string {
  return book.authors.join(', ')
}

async function handleAdd(book: BookCard) {
  if (shelvedIds.value.has(book.id) || pendingId.value !== null) return
  pendingId.value = book.id
  try {
    await addDashboardShelfBooks(props.shelfId, [book.id])
    addedIds.value = new Set([...addedIds.value, book.id])
    emit('added')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('dashboard.featured.errors.generic'))
  } finally {
    pendingId.value = null
  }
}
</script>

<template>
  <DialogRoot :open="open" @update:open="handleOpenChange">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px]" />
      <DialogContent
        aria-modal="true"
        class="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background shadow-xl focus-visible:outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[80vh] sm:w-[calc(100%-3rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-primary/40"
      >
        <div class="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <DialogTitle class="truncate text-base font-semibold">{{ t('dashboard.shelfBooks.pickerTitle', { title }) }}</DialogTitle>
          <DialogClose
            :aria-label="t('common.close')"
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X :size="16" />
          </DialogClose>
        </div>
        <DialogDescription class="px-5 pt-3 text-xs text-muted-foreground">{{ t('dashboard.shelfBooks.pickerDescription') }}</DialogDescription>

        <div class="px-5 py-3">
          <label class="relative block">
            <Search :size="14" class="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              :value="query"
              :placeholder="t('dashboard.shelfBooks.searchPlaceholder')"
              :aria-label="t('dashboard.shelfBooks.searchPlaceholder')"
              class="h-9 w-full rounded-md border border-input bg-background ps-8 pe-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              @input="handleQueryInput"
            />
          </label>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <div v-if="loading" class="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 :size="16" class="animate-spin" aria-hidden="true" />
            {{ t('common.loading') }}
          </div>
          <p v-else-if="showNoResults" class="py-8 text-center text-sm text-muted-foreground">{{ t('dashboard.shelfBooks.noResults') }}</p>
          <p v-else-if="results.length === 0" class="py-8 text-center text-sm text-muted-foreground">{{ t('dashboard.shelfBooks.searchHint') }}</p>

          <ul v-else class="space-y-1" data-testid="shelf-book-results">
            <li v-for="book in results" :key="book.id" class="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60">
              <img
                :src="coverUrl(book.id, 'thumbnail', book.updatedAt ?? book.addedAt)"
                alt=""
                class="h-12 w-8 shrink-0 rounded-sm bg-muted object-cover"
                loading="lazy"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-foreground">{{ book.title ?? t('dashboard.common.untitled') }}</span>
                <span class="block truncate text-xs text-muted-foreground">{{ bookAuthors(book) }}</span>
              </span>
              <span v-if="shelvedIds.has(book.id)" class="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                <Check :size="13" aria-hidden="true" />
                {{ t('dashboard.shelfBooks.added') }}
              </span>
              <button
                v-else
                type="button"
                class="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-primary/40 px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                :disabled="pendingId !== null"
                @click="handleAdd(book)"
              >
                <Loader2 v-if="pendingId === book.id" :size="12" class="animate-spin" aria-hidden="true" />
                <Plus v-else :size="12" aria-hidden="true" />
                {{ t('dashboard.shelfBooks.add') }}
              </button>
            </li>
          </ul>

          <button
            v-if="hasMore && !loading"
            type="button"
            class="mx-auto mt-3 flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
            :disabled="loadingMore"
            @click="handleLoadMore"
          >
            <Loader2 v-if="loadingMore" :size="12" class="animate-spin" aria-hidden="true" />
            {{ t('dashboard.shelfBooks.loadMore') }}
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
