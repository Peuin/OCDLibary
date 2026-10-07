<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus } from '@lucide/vue'

import type { BookCard, DashboardFeaturedShelf } from '@bookorbit/types'
import BookCoverCard from '@/features/book/components/BookCoverCard.vue'
import DashboardSaintCard from './DashboardSaintCard.vue'

export type ShelfBookAction = 'quick-view' | 'edit-metadata' | 'add-to-collection' | 'move-to-library' | 'delete'

const props = defineProps<{
  bands: BookCard[][]
  featured?: Pick<DashboardFeaturedShelf, 'saintName' | 'imageUrl'> | null
  showSaintCard: boolean
  /** Whether the saint card offers to open the full shelf. */
  saintAction?: boolean
  /** Whether each book offers to be taken off the shelf. */
  removable?: boolean
  /** Whether the shelf ends with a slot to add books to it. */
  addable?: boolean
}>()

const emit = defineEmits<{
  action: [book: BookCard, action: ShelfBookAction]
  'view-all': []
  remove: [book: BookCard]
  add: []
}>()

const { t } = useI18n()

const PORTRAIT_COVER_WIDTH_CLASS = 'w-[120px]'
const SQUARE_COVER_WIDTH_CLASS = 'w-[150px]'
// Beside a saint card the covers keep the design's proportion: as wide as 60% of the 200px card,
// 2:3 portraits at 120px and square covers at the same 180px height.
const SAINT_PORTRAIT_COVER_WIDTH_CLASS = 'w-[120px]'
const SAINT_SQUARE_COVER_WIDTH_CLASS = 'w-[180px]'

const scrollEl = ref<HTMLElement | null>(null)

function scrollBy(delta: number) {
  scrollEl.value?.scrollBy({ left: delta, behavior: 'smooth' })
}

function coverWidthClass(book: BookCard): string {
  const square = book.coverAspectRatio === '1/1'
  if (props.showSaintCard) return square ? SAINT_SQUARE_COVER_WIDTH_CLASS : SAINT_PORTRAIT_COVER_WIDTH_CLASS
  return square ? SQUARE_COVER_WIDTH_CLASS : PORTRAIT_COVER_WIDTH_CLASS
}

function coverAnimationDelay(index: number): string {
  return `${index * 35}ms`
}

function handleAction(book: BookCard, action: ShelfBookAction) {
  emit('action', book, action)
}

function handleViewAll() {
  emit('view-all')
}

function handleRemove(book: BookCard) {
  emit('remove', book)
}

function handleAdd() {
  emit('add')
}

function isLastBand(bandIndex: number): boolean {
  return bandIndex === props.bands.length - 1
}

const addSlotWidthClass = computed(() => (props.showSaintCard ? SAINT_PORTRAIT_COVER_WIDTH_CLASS : PORTRAIT_COVER_WIDTH_CLASS))

defineExpose({ scrollBy })
</script>

<template>
  <div ref="scrollEl" class="overflow-x-auto px-5 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" :class="showSaintCard ? 'pt-6' : 'pt-1'">
    <!-- With a saint card the rows sit in a second column, so every row and its ledge starts at the
         same point, right of the card. The card itself has no ledge and stays put while books scroll. -->
    <div class="w-max min-w-full" :class="showSaintCard ? 'grid grid-cols-[auto_1fr] gap-x-4 gap-y-6' : 'flex flex-col gap-6'">
      <div v-if="showSaintCard && featured" class="shelf-saint col-start-1 row-start-1 self-end">
        <DashboardSaintCard :saint-name="featured.saintName" :image-url="featured.imageUrl" :show-action="saintAction" @view-works="handleViewAll" />
      </div>
      <!-- A shelf with nothing on it (loading, empty, failed) keeps its ledge, with the message standing on it. -->
      <div
        v-if="bands.length === 0"
        data-testid="shelf-band-empty"
        class="shelf-band shelf-band-empty flex min-w-0 items-end"
        :class="{ 'col-start-2 self-end': showSaintCard }"
      >
        <button v-if="addable" type="button" data-testid="shelf-add-slot" class="shelf-add-slot" :class="addSlotWidthClass" @click="handleAdd">
          <Plus :size="22" class="text-primary" aria-hidden="true" />
          <span>{{ t('dashboard.shelfBooks.addSlot') }}</span>
        </button>
        <slot v-else name="empty" />
      </div>
      <div
        v-for="(band, bandIndex) in bands"
        :key="bandIndex"
        data-testid="shelf-band"
        class="shelf-band flex items-end gap-3.5"
        :class="{ 'col-start-2 self-end': showSaintCard }"
      >
        <div
          v-for="(book, index) in band"
          :key="book.id"
          class="shrink-0"
          :class="coverWidthClass(book)"
          style="animation: dashboardFadeUp 0.35s ease both"
          :style="{ animationDelay: coverAnimationDelay(index) }"
        >
          <BookCoverCard
            :book="book"
            :cover-aspect-ratio="book.coverAspectRatio"
            :removable-from-shelf="removable"
            @action="handleAction(book, $event)"
            @remove-from-shelf="handleRemove(book)"
          />
        </div>
        <button
          v-if="addable && isLastBand(bandIndex)"
          type="button"
          data-testid="shelf-add-slot"
          class="shelf-add-slot"
          :class="addSlotWidthClass"
          @click="handleAdd"
        >
          <Plus :size="22" class="text-primary" aria-hidden="true" />
          <span>{{ t('dashboard.shelfBooks.addSlot') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes dashboardFadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Each row of books stands on a thin wooden ledge, like a book stand. The ledge is tinted from
   the accent over the card colour, so it reads as wood without turning into a dark band. */
.shelf-band {
  position: relative;
  /* The ledge starts flush with the first cover; only the far end runs on past the last book. */
  padding-inline: 0 0.75rem;
  padding-bottom: 0.875rem;
}

.shelf-band::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  height: 0.875rem;
  border-radius: 3px;
  background: linear-gradient(
    180deg,
    color-mix(in oklch, var(--primary) 32%, var(--card)) 0,
    color-mix(in oklch, var(--primary) 32%, var(--card)) 0.3rem,
    color-mix(in oklch, var(--primary) 52%, var(--card)) 0.3rem,
    color-mix(in oklch, var(--primary) 44%, var(--card)) 100%
  );
  box-shadow:
    inset 0 1px 0 color-mix(in oklch, var(--card) 70%, transparent),
    0 10px 14px -10px color-mix(in oklch, var(--primary) 70%, transparent);
  pointer-events: none;
}

.shelf-band > * {
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 6px 6px color-mix(in oklch, var(--primary) 22%, transparent));
}

.shelf-band-empty > * {
  filter: none;
}

/* An empty book-sized slot at the end of the shelf, outlined like a gap waiting for a book. */
.shelf-add-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  flex-shrink: 0;
  aspect-ratio: 2 / 3;
  border: 2px dashed color-mix(in oklch, var(--primary) 35%, transparent);
  border-radius: var(--radius);
  background: color-mix(in oklch, var(--primary) 6%, transparent);
  color: var(--muted-foreground);
  font-size: 0.75rem;
  font-weight: 500;
  transition: background-color 150ms ease;
}

.shelf-add-slot:hover {
  background: color-mix(in oklch, var(--primary) 12%, transparent);
}

.shelf-add-slot:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

.shelf-saint {
  position: sticky;
  left: 0;
  z-index: 2;
  /* Lifted by the ledge's height so the card stands level with the first row's covers. */
  margin-bottom: 0.875rem;
}
</style>
