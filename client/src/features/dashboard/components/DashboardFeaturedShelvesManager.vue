<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { ChevronDown, ChevronUp, ImagePlus, LibraryBig, Loader2, Plus, Trash2, X } from '@lucide/vue'

import {
  DASHBOARD_ATTACHABLE_SHELF_TYPES,
  DASHBOARD_FEATURED_SHELF_MAX,
  DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX,
  DASHBOARD_FEATURED_SHELF_TITLE_MAX,
  type DashboardAttachableShelfType,
  type DashboardFeaturedShelf,
} from '@bookorbit/types'
import { useDashboardLabels } from '../composables/useDashboardLabels'
import { useCollections } from '@/features/collection/composables/useCollections'
import {
  createFeaturedShelf,
  deleteFeaturedShelf,
  deleteFeaturedShelfImage,
  fetchFeaturedShelves,
  reorderFeaturedShelves,
  updateFeaturedShelf,
  uploadFeaturedShelfImage,
} from '../api/dashboard-featured-shelf.api'

const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()
const { bookCollections, fetchCollections } = useCollections()

const shelves = ref<DashboardFeaturedShelf[]>([])
const loading = ref(true)
const busyShelfId = ref<number | null>(null)
const newCollectionId = ref<number | null>(null)
const newTitle = ref('')
const newSaintName = ref('')
const newAttachTo = ref<DashboardAttachableShelfType | ''>('')
const { shelfTypeName } = useDashboardLabels()
const creating = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadTargetId = ref<number | null>(null)

const publicCollections = computed(() => bookCollections.value.filter((collection) => collection.isPublic))
const privateCollections = computed(() => bookCollections.value.filter((collection) => !collection.isPublic))
const canAdd = computed(() => shelves.value.length < DASHBOARD_FEATURED_SHELF_MAX)
function isListedCollection(collectionId: number): boolean {
  return publicCollections.value.some((collection) => collection.id === collectionId)
}

// A built-in shelf takes one saint; the entry being edited keeps its own target listed.
function isAttachTargetTaken(type: DashboardAttachableShelfType, exceptId?: number): boolean {
  return shelves.value.some((shelf) => shelf.attachTo === type && shelf.id !== exceptId)
}

const canCreate = computed(() => canAdd.value && newCollectionId.value !== null && !creating.value)

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : t('dashboard.featured.errors.generic')
}

async function loadShelves() {
  loading.value = true
  try {
    shelves.value = await fetchFeaturedShelves()
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    loading.value = false
  }
}

function replaceShelf(updated: DashboardFeaturedShelf) {
  shelves.value = shelves.value.map((shelf) => (shelf.id === updated.id ? updated : shelf))
  emit('changed')
}

async function handleCreate() {
  if (newCollectionId.value === null) return
  creating.value = true
  try {
    const created = await createFeaturedShelf({
      collectionId: newCollectionId.value,
      ...(newTitle.value.trim() ? { title: newTitle.value.trim() } : {}),
      ...(newSaintName.value.trim() ? { saintName: newSaintName.value.trim() } : {}),
      ...(newAttachTo.value ? { attachTo: newAttachTo.value } : {}),
    })
    shelves.value = [...shelves.value, created]
    newCollectionId.value = null
    newTitle.value = ''
    newSaintName.value = ''
    newAttachTo.value = ''
    toast.success(t('dashboard.featured.toasts.created'))
    emit('changed')
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    creating.value = false
  }
}

async function handleTitleChange(shelf: DashboardFeaturedShelf, event: Event) {
  const title = (event.target as HTMLInputElement).value.trim()
  if (title === shelf.title) return
  busyShelfId.value = shelf.id
  try {
    replaceShelf(await updateFeaturedShelf(shelf.id, { title }))
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    busyShelfId.value = null
  }
}

async function handleSaintNameChange(shelf: DashboardFeaturedShelf, event: Event) {
  const saintName = (event.target as HTMLInputElement).value.trim()
  if (saintName === (shelf.saintName ?? '')) return
  busyShelfId.value = shelf.id
  try {
    replaceShelf(await updateFeaturedShelf(shelf.id, { saintName }))
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    busyShelfId.value = null
  }
}

async function handleAttachChange(shelf: DashboardFeaturedShelf, event: Event) {
  const value = (event.target as HTMLSelectElement).value as DashboardAttachableShelfType | ''
  const attachTo = value || null
  if (attachTo === shelf.attachTo) return
  busyShelfId.value = shelf.id
  try {
    replaceShelf(await updateFeaturedShelf(shelf.id, { attachTo }))
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    busyShelfId.value = null
  }
}

async function handleCollectionChange(shelf: DashboardFeaturedShelf, event: Event) {
  const collectionId = Number((event.target as HTMLSelectElement).value)
  if (!Number.isFinite(collectionId) || collectionId === shelf.collectionId) return
  busyShelfId.value = shelf.id
  try {
    replaceShelf(await updateFeaturedShelf(shelf.id, { collectionId }))
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    busyShelfId.value = null
  }
}

async function move(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= shelves.value.length) return
  const next = [...shelves.value]
  const [moved] = next.splice(index, 1)
  if (!moved) return
  next.splice(target, 0, moved)
  shelves.value = next
  try {
    shelves.value = await reorderFeaturedShelves(next.map((shelf) => shelf.id))
    emit('changed')
  } catch (error) {
    toast.error(errorMessage(error))
    await loadShelves()
  }
}

function handleMoveUp(index: number) {
  void move(index, -1)
}

function handleMoveDown(index: number) {
  void move(index, 1)
}

async function handleDelete(shelf: DashboardFeaturedShelf) {
  if (!window.confirm(t('dashboard.featured.confirmDelete', { title: shelf.title }))) return
  busyShelfId.value = shelf.id
  try {
    await deleteFeaturedShelf(shelf.id)
    shelves.value = shelves.value.filter((item) => item.id !== shelf.id)
    emit('changed')
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    busyShelfId.value = null
  }
}

function handlePickImage(shelf: DashboardFeaturedShelf) {
  uploadTargetId.value = shelf.id
  fileInput.value?.click()
}

async function handleImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  const shelfId = uploadTargetId.value
  input.value = ''
  if (!file || shelfId === null) return
  busyShelfId.value = shelfId
  try {
    replaceShelf(await uploadFeaturedShelfImage(shelfId, file))
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    busyShelfId.value = null
    uploadTargetId.value = null
  }
}

async function handleRemoveImage(shelf: DashboardFeaturedShelf) {
  busyShelfId.value = shelf.id
  try {
    replaceShelf(await deleteFeaturedShelfImage(shelf.id))
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    busyShelfId.value = null
  }
}

onMounted(() => {
  void loadShelves()
  void fetchCollections()
})
</script>

<template>
  <div>
    <p class="text-xs text-muted-foreground">{{ t('dashboard.featured.description') }}</p>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleImageSelected" />

    <div v-if="loading" class="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
      <Loader2 :size="16" class="animate-spin" aria-hidden="true" />
      {{ t('common.loading') }}
    </div>

    <div v-else class="mt-4 space-y-2">
      <p v-if="shelves.length === 0" class="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
        {{ t('dashboard.featured.empty') }}
      </p>

      <div v-for="(shelf, index) in shelves" :key="shelf.id" class="rounded-lg border border-border bg-card p-3">
        <div class="flex items-start gap-3">
          <div class="flex shrink-0 flex-col items-center gap-1">
            <button
              type="button"
              class="portrait-frame w-16 rounded-t-[999px] p-[3px] transition-opacity hover:opacity-85 disabled:opacity-50"
              :aria-label="t('dashboard.featured.uploadImage')"
              :title="t('dashboard.featured.uploadImage')"
              :disabled="busyShelfId === shelf.id"
              @click="handlePickImage(shelf)"
            >
              <span class="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-t-[999px] bg-muted text-muted-foreground">
                <img v-if="shelf.imageUrl" :src="shelf.imageUrl" alt="" class="h-full w-full object-cover" />
                <ImagePlus v-else :size="18" aria-hidden="true" />
              </span>
            </button>
            <span class="text-[10px] text-muted-foreground">{{ t('dashboard.featured.portraitLabel') }}</span>
            <button
              v-if="shelf.imageUrl"
              type="button"
              class="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-destructive"
              :disabled="busyShelfId === shelf.id"
              @click="handleRemoveImage(shelf)"
            >
              <X :size="11" aria-hidden="true" />
              {{ t('dashboard.featured.removeImage') }}
            </button>
          </div>

          <div class="min-w-0 flex-1 space-y-2">
            <input
              type="text"
              :value="shelf.title"
              :maxlength="DASHBOARD_FEATURED_SHELF_TITLE_MAX"
              :aria-label="t('dashboard.featured.titleLabel')"
              class="h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              :disabled="busyShelfId === shelf.id"
              @change="handleTitleChange(shelf, $event)"
            />
            <input
              type="text"
              :value="shelf.saintName ?? ''"
              :maxlength="DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX"
              :placeholder="t('dashboard.featured.saintNamePlaceholder')"
              :aria-label="t('dashboard.featured.saintNameLabel')"
              class="h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              :disabled="busyShelfId === shelf.id"
              @change="handleSaintNameChange(shelf, $event)"
            />
            <select
              :value="shelf.attachTo ?? ''"
              :aria-label="t('dashboard.featured.attachLabel')"
              class="h-8 w-full appearance-none rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              :disabled="busyShelfId === shelf.id"
              @change="handleAttachChange(shelf, $event)"
            >
              <option value="">{{ t('dashboard.featured.attachStandalone') }}</option>
              <option v-for="type in DASHBOARD_ATTACHABLE_SHELF_TYPES" :key="type" :value="type" :disabled="isAttachTargetTaken(type, shelf.id)">
                {{ t('dashboard.featured.attachOption', { shelf: shelfTypeName(type) }) }}
              </option>
            </select>
            <select
              :value="shelf.collectionId"
              :aria-label="t('dashboard.featured.collectionLabel')"
              class="h-8 w-full appearance-none rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              :disabled="busyShelfId === shelf.id"
              @change="handleCollectionChange(shelf, $event)"
            >
              <option v-if="!isListedCollection(shelf.collectionId)" :value="shelf.collectionId" disabled>
                {{ shelf.collectionName || t('dashboard.featured.unavailableCollection') }}
              </option>
              <option v-for="collection in publicCollections" :key="collection.id" :value="collection.id">{{ collection.name }}</option>
            </select>
          </div>

          <div class="flex shrink-0 flex-col items-center gap-1">
            <button
              type="button"
              class="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
              :aria-label="t('dashboard.featured.moveUp')"
              :disabled="index === 0"
              @click="handleMoveUp(index)"
            >
              <ChevronUp :size="14" />
            </button>
            <button
              type="button"
              class="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
              :aria-label="t('dashboard.featured.moveDown')"
              :disabled="index === shelves.length - 1"
              @click="handleMoveDown(index)"
            >
              <ChevronDown :size="14" />
            </button>
            <button
              type="button"
              class="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              :aria-label="t('dashboard.featured.delete')"
              :disabled="busyShelfId === shelf.id"
              @click="handleDelete(shelf)"
            >
              <Trash2 :size="13" />
            </button>
          </div>
        </div>
      </div>

      <div class="mt-4 rounded-lg border border-dashed border-border p-3">
        <p class="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
          <LibraryBig :size="15" aria-hidden="true" />
          {{ t('dashboard.featured.addTitle') }}
          <span class="text-xs font-normal text-muted-foreground">({{ shelves.length }}/{{ DASHBOARD_FEATURED_SHELF_MAX }})</span>
        </p>
        <div class="space-y-2">
          <select
            v-model="newCollectionId"
            :aria-label="t('dashboard.featured.collectionLabel')"
            class="h-8 w-full appearance-none rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            :disabled="!canAdd"
          >
            <option :value="null" disabled>{{ t('dashboard.featured.chooseCollection') }}</option>
            <option v-for="collection in publicCollections" :key="collection.id" :value="collection.id">{{ collection.name }}</option>
          </select>
          <input
            v-model="newTitle"
            type="text"
            :maxlength="DASHBOARD_FEATURED_SHELF_TITLE_MAX"
            :placeholder="t('dashboard.featured.titlePlaceholder')"
            :aria-label="t('dashboard.featured.titleLabel')"
            class="h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            :disabled="!canAdd"
          />
          <input
            v-model="newSaintName"
            type="text"
            :maxlength="DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX"
            :placeholder="t('dashboard.featured.saintNamePlaceholder')"
            :aria-label="t('dashboard.featured.saintNameLabel')"
            class="h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            :disabled="!canAdd"
          />
          <select
            v-model="newAttachTo"
            :aria-label="t('dashboard.featured.attachLabel')"
            class="h-8 w-full appearance-none rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            :disabled="!canAdd"
          >
            <option value="">{{ t('dashboard.featured.attachStandalone') }}</option>
            <option v-for="type in DASHBOARD_ATTACHABLE_SHELF_TYPES" :key="type" :value="type" :disabled="isAttachTargetTaken(type)">
              {{ t('dashboard.featured.attachOption', { shelf: shelfTypeName(type) }) }}
            </option>
          </select>
          <button
            type="button"
            class="flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            :disabled="!canCreate"
            @click="handleCreate"
          >
            <Loader2 v-if="creating" :size="14" class="animate-spin" aria-hidden="true" />
            <Plus v-else :size="14" aria-hidden="true" />
            {{ t('dashboard.featured.add') }}
          </button>
        </div>
        <p v-if="publicCollections.length === 0" class="mt-2 text-xs text-muted-foreground">{{ t('dashboard.featured.noPublicCollections') }}</p>
        <p v-else-if="privateCollections.length > 0" class="mt-2 text-xs text-muted-foreground">
          {{ t('dashboard.featured.privateHint', { count: privateCollections.length }) }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.portrait-frame {
  background: linear-gradient(160deg, var(--saint-frame-gold), color-mix(in oklch, var(--saint-frame-gold) 55%, var(--primary)));
}
</style>
