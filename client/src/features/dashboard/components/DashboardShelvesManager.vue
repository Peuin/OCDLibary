<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { ChevronDown, ChevronUp, GripVertical, Loader2, Plus, Trash2 } from '@lucide/vue'

import { DASHBOARD_FEATURED_SHELF_MAX, DASHBOARD_FEATURED_SHELF_TITLE_MAX, type DashboardFeaturedShelf } from '@bookorbit/types'
import { createFeaturedShelf, deleteFeaturedShelf, reorderFeaturedShelves, updateFeaturedShelf } from '../api/dashboard-featured-shelf.api'
import { useDashboardSharedConfig } from '../composables/useDashboardSharedConfig'
import { useDraggableList } from '../composables/useDraggableList'
import { SHELF_ROW_OPTIONS } from '../lib/shelf-rows'
import DashboardSaintCardEditor from './DashboardSaintCardEditor.vue'

const { t } = useI18n()
const { orderedShelves, upsertShelf, removeShelf, replaceShelves } = useDashboardSharedConfig()

// A local copy the drag handlers can reorder; a changed order is saved, then the server's copy wins.
const list = ref<DashboardFeaturedShelf[]>([])
watch(
  orderedShelves,
  (shelves) => {
    list.value = [...shelves]
  },
  { immediate: true },
)

const { draggedIndex, dragOverIndex, onDragStart, onDragOver, onDrop, onDragEnd, moveUp, moveDown } = useDraggableList(list)

const busyId = ref<number | null>(null)
const creating = ref(false)

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : t('dashboard.featured.errors.generic')
}

watch(list, async (next) => {
  const ids = next.map((shelf) => shelf.id)
  if (ids.join(',') === orderedShelves.value.map((shelf) => shelf.id).join(',')) return
  try {
    replaceShelves(await reorderFeaturedShelves(ids))
  } catch (error) {
    toast.error(errorMessage(error))
    list.value = [...orderedShelves.value]
  }
})

async function save(shelf: DashboardFeaturedShelf, patch: { title?: string; rows?: number }) {
  busyId.value = shelf.id
  try {
    upsertShelf(await updateFeaturedShelf(shelf.id, patch))
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    busyId.value = null
  }
}

function handleTitleChange(shelf: DashboardFeaturedShelf, event: Event) {
  const input = event.target as HTMLInputElement
  const title = input.value.trim()
  if (!title) {
    input.value = shelf.title
    return
  }
  if (title !== shelf.title) void save(shelf, { title })
}

function handleRowsChange(shelf: DashboardFeaturedShelf, rows: number) {
  if (rows !== shelf.rows) void save(shelf, { rows })
}

async function handleDelete(shelf: DashboardFeaturedShelf) {
  if (!window.confirm(t('dashboard.shelves.confirmDelete', { title: shelf.title }))) return
  busyId.value = shelf.id
  try {
    await deleteFeaturedShelf(shelf.id)
    removeShelf(shelf.id)
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    busyId.value = null
  }
}

async function handleAddShelf() {
  creating.value = true
  try {
    upsertShelf(await createFeaturedShelf({ title: t('dashboard.shelves.newTitle') }))
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div>
    <p class="text-xs text-muted-foreground">{{ t('dashboard.shelves.hint') }}</p>

    <p v-if="list.length === 0" class="mt-4 rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
      {{ t('dashboard.shelves.empty') }}
    </p>

    <div class="mt-4 space-y-2">
      <div
        v-for="(shelf, index) in list"
        :key="shelf.id"
        draggable="true"
        data-testid="shelf-manager-item"
        class="rounded-lg border border-border bg-card transition-all duration-150"
        :class="{
          'border-primary/50 bg-primary/5 shadow-sm': dragOverIndex === index && draggedIndex !== index,
          'opacity-40': draggedIndex === index,
        }"
        @dragstart="onDragStart(index)"
        @dragover="onDragOver($event, index)"
        @drop="onDrop(index)"
        @dragend="onDragEnd"
      >
        <div class="flex items-center gap-3 px-3 py-2.5">
          <div class="flex shrink-0 flex-col items-center">
            <button
              type="button"
              class="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-20"
              :aria-label="t('dashboard.shelves.moveUp')"
              :disabled="index === 0"
              @click="moveUp(index)"
            >
              <ChevronUp :size="13" />
            </button>
            <div class="cursor-grab text-muted-foreground active:cursor-grabbing">
              <GripVertical :size="16" />
            </div>
            <button
              type="button"
              class="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-20"
              :aria-label="t('dashboard.shelves.moveDown')"
              :disabled="index === list.length - 1"
              @click="moveDown(index)"
            >
              <ChevronDown :size="13" />
            </button>
          </div>

          <input
            type="text"
            :value="shelf.title"
            :maxlength="DASHBOARD_FEATURED_SHELF_TITLE_MAX"
            :aria-label="t('dashboard.shelves.titleLabel')"
            :placeholder="t('dashboard.shelves.titleLabel')"
            data-testid="shelf-title-input"
            class="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            :disabled="busyId === shelf.id"
            @change="handleTitleChange(shelf, $event)"
          />

          <div
            role="group"
            :aria-label="t('dashboard.settings.shelfRows.label')"
            class="flex shrink-0 overflow-hidden rounded-md border border-input"
          >
            <button
              v-for="rowOption in SHELF_ROW_OPTIONS"
              :key="rowOption"
              type="button"
              class="h-8 w-7 border-e border-input text-xs font-medium tabular-nums transition-colors last:border-e-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              :class="shelf.rows === rowOption ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
              :aria-pressed="shelf.rows === rowOption"
              :aria-label="t('dashboard.settings.shelfRows.option', { count: rowOption })"
              :disabled="busyId === shelf.id"
              @click="handleRowsChange(shelf, rowOption)"
            >
              {{ rowOption }}
            </button>
          </div>

          <button
            type="button"
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
            :aria-label="t('dashboard.shelves.delete')"
            :title="t('dashboard.shelves.delete')"
            :disabled="busyId === shelf.id"
            @click="handleDelete(shelf)"
          >
            <Trash2 :size="14" />
          </button>
        </div>

        <div class="border-t border-border/50 px-3 pb-2.5 pt-2">
          <DashboardSaintCardEditor :shelf="shelf" />
        </div>
      </div>
    </div>

    <button
      type="button"
      data-testid="shelf-manager-add"
      class="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
      :disabled="creating || list.length >= DASHBOARD_FEATURED_SHELF_MAX"
      @click="handleAddShelf"
    >
      <Loader2 v-if="creating" :size="15" class="animate-spin" aria-hidden="true" />
      <Plus v-else :size="15" aria-hidden="true" />
      {{ t('dashboard.settings.addShelf') }}
      <span class="text-xs opacity-60">({{ list.length }}/{{ DASHBOARD_FEATURED_SHELF_MAX }})</span>
    </button>
  </div>
</template>
