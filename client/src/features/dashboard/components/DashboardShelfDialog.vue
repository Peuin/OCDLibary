<script setup lang="ts">
import { ref, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight, X } from '@lucide/vue'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'

import type { BookCard, DashboardFeaturedShelf } from '@bookorbit/types'
import DashboardShelfRows, { type ShelfBookAction } from './DashboardShelfRows.vue'

defineProps<{
  open: boolean
  title: string
  icon: Component
  count: number
  bands: BookCard[][]
  featured?: Pick<DashboardFeaturedShelf, 'saintName' | 'imageUrl'> | null
  showSaintCard: boolean
  removable?: boolean
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  action: [book: BookCard, action: ShelfBookAction]
  remove: [book: BookCard]
}>()

const { t } = useI18n()

const rowsRef = ref<InstanceType<typeof DashboardShelfRows> | null>(null)

function handleOpenChange(open: boolean) {
  emit('update:open', open)
}

function handleScrollBack() {
  rowsRef.value?.scrollBy(-560)
}

function handleScrollForward() {
  rowsRef.value?.scrollBy(560)
}

function handleAction(book: BookCard, action: ShelfBookAction) {
  emit('action', book, action)
}

function handleRemove(book: BookCard) {
  emit('remove', book)
}
</script>

<template>
  <DialogRoot :open="open" @update:open="handleOpenChange">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px]" />
      <DialogContent
        aria-modal="true"
        class="fixed inset-0 z-50 flex flex-col overflow-hidden border-primary/40 bg-background shadow-xl focus-visible:outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-[calc(100%-3rem)] sm:max-w-[1600px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border"
      >
        <div class="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
          <div class="flex min-w-0 items-center gap-2.5">
            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
              <component :is="icon" :size="14" class="text-foreground" />
            </div>
            <DialogTitle class="truncate text-[15px] font-bold tracking-tight">{{ title }}</DialogTitle>
            <span class="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-bold tabular-nums text-foreground">
              {{ count }}
            </span>
          </div>
          <DialogDescription class="sr-only">{{ t('dashboard.scroller.viewAllDescription', { title }) }}</DialogDescription>
          <div class="flex shrink-0 items-center gap-0.5">
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
            <DialogClose
              :aria-label="t('common.close')"
              class="ms-1 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X :size="16" />
            </DialogClose>
          </div>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <DashboardShelfRows
            ref="rowsRef"
            :bands="bands"
            :featured="featured"
            :show-saint-card="showSaintCard"
            :removable="removable"
            @action="handleAction"
            @remove="handleRemove"
          />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
