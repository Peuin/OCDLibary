<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, ChevronUp, Columns2, GripVertical, Loader2, RotateCcw, Rows3, Users } from '@lucide/vue'
import { toast } from 'vue-sonner'

import type { WidgetConfig } from '@bookorbit/types'
import { formatList } from '@/i18n/formatters'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useLibraries } from '@/features/library/composables/useLibraries'
import { usePermissions } from '@/features/auth/composables/usePermissions'
import { saveDashboardDefaultLayout } from '../api/dashboard-featured-shelf.api'
import DashboardShelvesManager from './DashboardShelvesManager.vue'
import { SHELF_LAYOUT, useDashboardConfig, type DashboardShelfLayout } from '../composables/useDashboardConfig'
import { useDashboardLabels } from '../composables/useDashboardLabels'
import { useDashboardWidgets } from '../composables/useDashboardWidgets'
import { useDraggableList } from '../composables/useDraggableList'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; saved: []; 'shared-changed': [] }>()

const { t } = useI18n()

const { shelfLayout, saveShelfLayout, defaultShelfLayout } = useDashboardConfig()
const { hasPermission } = usePermissions()
const canManageShared = computed(() => hasPermission('manage_app_settings'))
const { widgets, libraryIds, saveWidgets, saveLibraryScope, DEFAULT_WIDGETS } = useDashboardWidgets()
const { libraries, fetchLibraries } = useLibraries()
const { widgetName } = useDashboardLabels()

const activeTab = ref<'widgets' | 'shelves'>('shelves')
const savingDefault = ref(false)
const shelfLayoutDraft = ref<DashboardShelfLayout>(SHELF_LAYOUT.WIDE)
const widgetDraft = ref<WidgetConfig[]>([])
const libraryIdsDraft = ref<number[] | null>(null)
const libraryScopeOpen = ref(false)
const saving = ref(false)
const bookLibraries = computed(() => libraries.value)
const accessibleLibraryIds = computed(() => new Set(bookLibraries.value.map((library) => library.id)))
const selectedAccessibleLibraryIds = computed<number[] | null>(() =>
  libraryIdsDraft.value === null ? null : libraryIdsDraft.value.filter((libraryId) => accessibleLibraryIds.value.has(libraryId)),
)
const hasValidLibrarySelection = computed(() => selectedAccessibleLibraryIds.value === null || selectedAccessibleLibraryIds.value.length > 0)

const MAX_SUMMARY_NAMES = 3
const librarySelectionSummary = computed(() => {
  const selected = selectedAccessibleLibraryIds.value
  if (selected === null) return t('dashboard.settings.libraryScope.allLibraries')
  if (selected.length === 0) return t('dashboard.settings.libraryScope.summaryNone')
  if (selected.length > MAX_SUMMARY_NAMES) return t('dashboard.settings.libraryScope.summaryCount', { count: selected.length }, selected.length)
  const selectedIds = new Set(selected)
  return formatList(bookLibraries.value.filter((library) => selectedIds.has(library.id)).map((library) => library.name))
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      shelfLayoutDraft.value = shelfLayout.value
      widgetDraft.value = widgets.value.map((w) => ({ ...w }))
      libraryIdsDraft.value = libraryIds.value ? [...libraryIds.value] : null
      libraryScopeOpen.value = false
      fetchLibraries()
    }
  },
)

// ── Drag to reorder ──────────────────────────────────────────
const {
  draggedIndex: widgetDraggedIndex,
  dragOverIndex: widgetDragOverIndex,
  onDragStart: onWidgetDragStart,
  onDragOver: onWidgetDragOver,
  onDrop: onWidgetDrop,
  onDragEnd: onWidgetDragEnd,
  moveUp: widgetMoveUp,
  moveDown: widgetMoveDown,
} = useDraggableList(widgetDraft)
function selectShelvesTab() {
  activeTab.value = 'shelves'
}

function selectWidgetsTab() {
  activeTab.value = 'widgets'
}

// The shelves are already everyone's; what an administrator sets as the default is the layout.
async function handleSaveAsDefault() {
  if (!window.confirm(t('dashboard.featured.confirmDefault'))) return
  savingDefault.value = true
  try {
    await saveDashboardDefaultLayout({ scrollers: [], shelfLayout: shelfLayoutDraft.value })
    toast.success(t('dashboard.featured.toasts.defaultSaved'))
    emit('shared-changed')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('dashboard.featured.errors.generic'))
  } finally {
    savingDefault.value = false
  }
}

function toggleLibraryScope() {
  libraryScopeOpen.value = !libraryScopeOpen.value
}

function handleAllLibrariesChange(event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  libraryIdsDraft.value = checked ? null : bookLibraries.value.map((library) => library.id)
}

function handleLibraryChange(libraryId: number, event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  const selected = new Set(libraryIdsDraft.value ?? bookLibraries.value.map((library) => library.id))
  if (checked) selected.add(libraryId)
  else selected.delete(libraryId)
  libraryIdsDraft.value = [...selected]
}

// ── Save / Reset / Close ─────────────────────────────────────
async function saveShelves() {
  saveShelfLayout(shelfLayoutDraft.value)
  await saveLibraryScope(selectedAccessibleLibraryIds.value)
}

function selectWideShelfLayout() {
  shelfLayoutDraft.value = SHELF_LAYOUT.WIDE
}

function selectTwoColumnShelfLayout() {
  shelfLayoutDraft.value = SHELF_LAYOUT.TWO_COLUMNS
}

async function saveWidgetSettings() {
  await saveWidgets(widgetDraft.value, selectedAccessibleLibraryIds.value)
}

async function handleSave() {
  if (!hasValidLibrarySelection.value) {
    libraryScopeOpen.value = true
    return
  }
  saving.value = true
  try {
    if (activeTab.value === 'widgets') await saveWidgetSettings()
    else await saveShelves()
    emit('saved')
    emit('update:open', false)
  } finally {
    saving.value = false
  }
}

function resetToDefault() {
  if (activeTab.value === 'widgets') {
    widgetDraft.value = DEFAULT_WIDGETS.map((w) => ({ ...w }))
  } else {
    shelfLayoutDraft.value = defaultShelfLayout()
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <!-- SheetContent defaults to sm:max-w-sm; the override has to match that variant to win in tailwind-merge. -->
    <SheetContent side="right" class="flex w-[90vw] flex-col gap-0 p-0 sm:max-w-[480px]">
      <!-- Header -->
      <SheetHeader class="border-b border-border px-5 py-4">
        <SheetTitle class="text-base font-semibold">{{ t('dashboard.settings.title') }}</SheetTitle>
      </SheetHeader>

      <!-- Tabs -->
      <div class="border-b border-border px-5 py-2">
        <div class="flex items-center gap-1 rounded-lg bg-muted p-1">
          <button
            :class="[
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === 'shelves' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            ]"
            @click="selectShelvesTab"
          >
            {{ t('dashboard.settings.tabs.shelves') }}
          </button>
          <button
            :class="[
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === 'widgets' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            ]"
            @click="selectWidgetsTab"
          >
            {{ t('dashboard.settings.tabs.widgets') }}
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-5 py-4">
        <div class="mb-4 rounded-lg border border-border bg-card">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :aria-expanded="libraryScopeOpen"
            aria-controls="dashboard-library-scope"
            @click="toggleLibraryScope"
          >
            <span class="min-w-0 grow">
              <span class="block text-sm font-medium text-foreground">{{ t('dashboard.settings.libraryScope.title') }}</span>
              <span class="mt-0.5 block truncate text-xs text-muted-foreground">{{ librarySelectionSummary }}</span>
            </span>
            <ChevronDown
              :size="16"
              class="shrink-0 text-muted-foreground transition-transform duration-150"
              :class="{ 'rotate-180': libraryScopeOpen }"
              aria-hidden="true"
            />
          </button>
          <fieldset v-show="libraryScopeOpen" id="dashboard-library-scope" class="border-t border-border px-3 pb-3 pt-2">
            <legend class="sr-only">{{ t('dashboard.settings.libraryScope.title') }}</legend>
            <p class="mb-2 text-xs text-muted-foreground">{{ t('dashboard.settings.libraryScope.description') }}</p>
            <div class="space-y-1">
              <label class="flex min-h-9 cursor-pointer items-center gap-3 rounded-md px-2 text-sm hover:bg-muted/60">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  :checked="libraryIdsDraft === null"
                  @change="handleAllLibrariesChange"
                />
                <span class="font-medium text-foreground">{{ t('dashboard.settings.libraryScope.allLibraries') }}</span>
              </label>
              <div v-if="libraryIdsDraft !== null" class="space-y-0.5 border-s border-border ps-3">
                <label
                  v-for="library in bookLibraries"
                  :key="library.id"
                  class="flex min-h-9 cursor-pointer items-center gap-3 rounded-md px-2 text-sm hover:bg-muted/60"
                >
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    :checked="libraryIdsDraft.includes(library.id)"
                    @change="handleLibraryChange(library.id, $event)"
                  />
                  <span class="text-foreground">{{ library.name }}</span>
                </label>
              </div>
            </div>
          </fieldset>
          <p v-if="!hasValidLibrarySelection" role="alert" class="border-t border-border px-3 py-2 text-xs text-destructive">
            {{ t('dashboard.settings.libraryScope.required') }}
          </p>
        </div>

        <!-- SHELVES TAB -->
        <div v-show="activeTab === 'shelves'">
          <fieldset class="mb-5">
            <legend class="text-sm font-medium text-foreground">{{ t('dashboard.settings.shelfLayout.title') }}</legend>
            <p class="mt-1 text-xs text-muted-foreground">{{ t('dashboard.settings.shelfLayout.description') }}</p>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                class="flex min-w-0 flex-col items-start gap-2 rounded-lg border p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :class="
                  shelfLayoutDraft === SHELF_LAYOUT.WIDE
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                "
                :aria-pressed="shelfLayoutDraft === SHELF_LAYOUT.WIDE"
                @click="selectWideShelfLayout"
              >
                <Rows3 :size="18" aria-hidden="true" />
                <span>
                  <span class="block text-sm font-medium">{{ t('dashboard.settings.shelfLayout.wide') }}</span>
                  <span class="mt-0.5 block text-xs font-normal">{{ t('dashboard.settings.shelfLayout.wideDescription') }}</span>
                </span>
              </button>
              <button
                type="button"
                class="flex min-w-0 flex-col items-start gap-2 rounded-lg border p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :class="
                  shelfLayoutDraft === SHELF_LAYOUT.TWO_COLUMNS
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                "
                :aria-pressed="shelfLayoutDraft === SHELF_LAYOUT.TWO_COLUMNS"
                @click="selectTwoColumnShelfLayout"
              >
                <Columns2 :size="18" aria-hidden="true" />
                <span>
                  <span class="block text-sm font-medium">{{ t('dashboard.settings.shelfLayout.twoColumns') }}</span>
                  <span class="mt-0.5 block text-xs font-normal">{{ t('dashboard.settings.shelfLayout.twoColumnsDescription') }}</span>
                </span>
              </button>
            </div>
          </fieldset>

          <DashboardShelvesManager v-if="canManageShared" />
          <p v-else class="text-xs text-muted-foreground">{{ t('dashboard.shelves.readOnlyHint') }}</p>

          <div v-if="canManageShared" class="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p class="text-sm font-medium text-foreground">{{ t('dashboard.featured.defaultTitle') }}</p>
            <p class="mt-1 text-xs text-muted-foreground">{{ t('dashboard.featured.defaultDescription') }}</p>
            <button
              type="button"
              class="mt-2 inline-flex h-8 items-center gap-1.5 rounded-md border border-primary/40 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
              :disabled="savingDefault"
              @click="handleSaveAsDefault"
            >
              <Loader2 v-if="savingDefault" :size="14" class="animate-spin" aria-hidden="true" />
              <Users v-else :size="14" aria-hidden="true" />
              {{ t('dashboard.featured.saveAsDefault') }}
            </button>
          </div>
        </div>

        <!-- WIDGETS TAB -->
        <div v-show="activeTab === 'widgets'">
          <p class="mb-4 text-xs text-muted-foreground">{{ t('dashboard.settings.reorderHintWidget') }}</p>

          <div class="space-y-2">
            <div
              v-for="(widget, index) in widgetDraft"
              :key="widget.id"
              draggable="true"
              class="rounded-lg border border-border bg-card transition-all duration-150"
              :class="{
                'border-primary/50 bg-primary/5 shadow-sm': widgetDragOverIndex === index && widgetDraggedIndex !== index,
                'opacity-40': widgetDraggedIndex === index,
              }"
              @dragstart="onWidgetDragStart(index)"
              @dragover="onWidgetDragOver($event, index)"
              @drop="onWidgetDrop(index)"
              @dragend="onWidgetDragEnd"
            >
              <div class="flex items-center gap-3 px-3 py-2.5">
                <div class="flex shrink-0 flex-col items-center">
                  <button
                    class="touch-reorder-btn flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-20"
                    :disabled="index === 0"
                    @click="widgetMoveUp(index)"
                  >
                    <ChevronUp :size="13" />
                  </button>
                  <div class="drag-handle cursor-grab text-muted-foreground hover:text-muted-foreground active:cursor-grabbing">
                    <GripVertical :size="16" />
                  </div>
                  <button
                    class="touch-reorder-btn flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-20"
                    :disabled="index === widgetDraft.length - 1"
                    @click="widgetMoveDown(index)"
                  >
                    <ChevronDown :size="13" />
                  </button>
                </div>

                <button
                  class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                  :class="widget.enabled ? 'bg-primary' : 'bg-muted'"
                  @click="widget.enabled = !widget.enabled"
                >
                  <span
                    class="pointer-events-none block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200"
                    :class="widget.enabled ? 'translate-x-4' : 'translate-x-0'"
                  />
                </button>

                <span class="flex-1 text-sm font-medium">{{ widgetName(widget.type) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between border-t border-border px-5 py-4">
        <button class="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground" @click="resetToDefault">
          <RotateCcw :size="13" />
          {{ t('dashboard.settings.resetToDefaults') }}
        </button>
        <div class="flex items-center gap-2">
          <button
            class="h-8 rounded-md border border-input px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            @click="emit('update:open', false)"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            class="h-8 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            :disabled="saving || !hasValidLibrarySelection"
            @click="handleSave"
          >
            {{ t('common.save') }}
          </button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<style scoped>
/* On pointer-fine devices (mouse), hide the up/down buttons; drag handles suffice */
@media (pointer: fine) {
  .touch-reorder-btn {
    display: none;
  }
}

/* On touch/coarse devices, hide the drag handle since HTML5 drag doesn't work on touch */
@media (pointer: coarse) {
  .drag-handle {
    display: none;
  }
}
</style>
