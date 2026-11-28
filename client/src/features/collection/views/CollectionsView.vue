<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Collection } from '@bookorbit/types'
import EntityIndexView, { type EntityIndexItem } from '@/components/entity-index/EntityIndexView.vue'
import CreateCollectionDialog from '@/features/collection/components/CreateCollectionDialog.vue'
import EditCollectionDialog from '@/features/collection/components/EditCollectionDialog.vue'
import CollectionContextMenu from '@/features/collection/components/CollectionContextMenu.vue'
import { useCollections } from '@/features/collection/composables/useCollections'
import { canMutateCollection } from '@/features/collection/lib/collection-access'

defineOptions({ name: 'CollectionsView' })

const { t } = useI18n()
const { bookCollections, loading, fetchCollections } = useCollections()

const createOpen = ref(false)
const contextMenuCollection = ref<Collection | null>(null)
const contextMenuPosition = ref<{ x: number; y: number } | null>(null)
const editingCollection = ref<Collection | null>(null)

function openCreate() {
  createOpen.value = true
}

function closeCreate() {
  createOpen.value = false
}

function closeContextMenu() {
  contextMenuCollection.value = null
  contextMenuPosition.value = null
}

function openEditor(collection: Collection) {
  editingCollection.value = collection
  closeContextMenu()
}

function closeEditor() {
  editingCollection.value = null
}

function handleCollectionContextMenu(item: EntityIndexItem, event: MouseEvent) {
  event.preventDefault()
  const collection = bookCollections.value.find((candidate) => candidate.id === item.id) ?? null
  if (!canMutateCollection(collection)) {
    closeContextMenu()
    return
  }
  contextMenuCollection.value = collection
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
}

onMounted(() => {
  void fetchCollections()
})
</script>

<template>
  <div class="h-full">
    <CreateCollectionDialog :open="createOpen" @close="closeCreate" />
    <EditCollectionDialog v-if="editingCollection" :open="true" :collection="editingCollection" @close="closeEditor" />
    <CollectionContextMenu :collection="contextMenuCollection" :position="contextMenuPosition" @edit="openEditor" @close="closeContextMenu" />
    <EntityIndexView
      :title="t('titles.collections')"
      title-icon="FolderOpen"
      fallback-icon="FolderOpen"
      :items="bookCollections"
      route-name="collection"
      :loading="loading"
      :search-placeholder="t('components.sidebar.filterCollectionsPlaceholder')"
      :empty-title="t('components.sidebar.noCollections')"
      :empty-hint="t('components.entityIndex.collectionsEmptyHint')"
      can-add
      :add-label="t('components.sidebar.newCollection')"
      @add="openCreate"
      @item-contextmenu="handleCollectionContextMenu"
    />
  </div>
</template>
