<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ReaderBottomSheet from '../../shared/components/ReaderBottomSheet.vue'
import ReaderSearchPanelContent from './ReaderSearchPanelContent.vue'
import type { SearchResult } from '../composables/useSearch'

type EpubSearchPanelLayout = 'dock' | 'sheet'

withDefaults(
  defineProps<{
    results: SearchResult[]
    isSearching: boolean
    initialQuery?: string
    navigationLocked?: boolean
    layout?: EpubSearchPanelLayout
  }>(),
  { layout: 'dock', navigationLocked: false },
)

const emit = defineEmits<{
  search: [query: string]
  clear: []
  navigate: [cfi: string]
  close: []
}>()

const { t } = useI18n()

function handleSearch(query: string) {
  emit('search', query)
}

function handleClear() {
  emit('clear')
}

function handleNavigate(cfi: string) {
  emit('navigate', cfi)
}

function handleClose() {
  emit('close')
}

function handleSheetOpen(open: boolean) {
  if (!open) emit('close')
}
</script>

<template>
  <aside
    v-if="layout === 'dock'"
    data-testid="epub-search-dock"
    class="fixed inset-y-0 left-0 z-50 flex w-80 flex-col overflow-hidden border-r border-border bg-card text-card-foreground shadow-2xl"
  >
    <ReaderSearchPanelContent
      :results="results"
      :is-searching="isSearching"
      :initial-query="initialQuery"
      :navigation-locked="navigationLocked"
      @search="handleSearch"
      @clear="handleClear"
      @navigate="handleNavigate"
      @close="handleClose"
    />
  </aside>

  <ReaderBottomSheet v-else :open="true" :label="t('common.search')" @update:open="handleSheetOpen">
    <ReaderSearchPanelContent
      :results="results"
      :is-searching="isSearching"
      :initial-query="initialQuery"
      :navigation-locked="navigationLocked"
      @search="handleSearch"
      @clear="handleClear"
      @navigate="handleNavigate"
      @close="handleClose"
    />
  </ReaderBottomSheet>
</template>

<style scoped>
[data-testid='epub-search-dock'] {
  animation: slide-in-from-left 0.2s ease-out;
}

@keyframes slide-in-from-left {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
