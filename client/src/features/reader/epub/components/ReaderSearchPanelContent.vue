<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader2, Search, X } from '@lucide/vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import type { SearchResult } from '../composables/useSearch'
import { MIN_SEARCH_QUERY_LENGTH } from '../composables/useSearch'

const { t } = useI18n()

const props = defineProps<{
  results: SearchResult[]
  isSearching: boolean
  initialQuery?: string
  navigationLocked?: boolean
}>()

const emit = defineEmits<{
  search: [query: string]
  clear: []
  navigate: [cfi: string]
  close: []
}>()

const inputValue = ref(props.initialQuery ?? '')
const input = ref<HTMLInputElement | null>(null)
const trimmedInputValue = computed(() => inputValue.value.trim())
const isTooShort = computed(() => trimmedInputValue.value.length > 0 && trimmedInputValue.value.length < MIN_SEARCH_QUERY_LENGTH)
const rows = computed(() =>
  props.results.map((result, index) => ({
    id: `${index}:${result.cfi}`,
    result,
    startsSection: index === 0 || props.results[index - 1]?.sectionTitle !== result.sectionTitle,
  })),
)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(inputValue, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  const normalized = val.trim()
  if (!normalized || normalized.length < MIN_SEARCH_QUERY_LENGTH) {
    emit('clear')
    return
  }
  debounceTimer = setTimeout(() => {
    emit('search', normalized)
  }, 600)
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

function handleClear() {
  inputValue.value = ''
  emit('clear')
  input.value?.focus()
}

function handleNavigate(cfi: string) {
  if (props.navigationLocked) return
  emit('navigate', cfi)
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="shrink-0 border-b border-border p-3">
      <div class="flex items-center gap-2">
        <div class="relative min-w-0 flex-1">
          <Search :size="15" class="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            ref="input"
            v-model="inputValue"
            type="search"
            :placeholder="t('reader.search.placeholder', { min: MIN_SEARCH_QUERY_LENGTH })"
            :aria-label="t('reader.search.placeholder', { min: MIN_SEARCH_QUERY_LENGTH })"
            class="h-9 w-full rounded-md border border-border bg-background ps-9 pe-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            autofocus
          />
          <button
            v-if="inputValue"
            type="button"
            class="absolute end-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            :aria-label="t('reader.pdf.sidebar.clearSearch')"
            @click="handleClear"
          >
            <X :size="14" />
          </button>
        </div>
        <button type="button" class="viewer-btn" :aria-label="t('common.close')" @click="handleClose">
          <X :size="17" />
        </button>
      </div>
    </div>

    <div v-if="isSearching" class="flex flex-1 items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
      <Loader2 :size="16" class="animate-spin" />
      {{ t('reader.search.searching') }}
    </div>

    <div v-else-if="isTooShort" class="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground">
      {{ t('reader.search.tooShort', { min: MIN_SEARCH_QUERY_LENGTH }) }}
    </div>

    <div
      v-else-if="trimmedInputValue && results.length === 0"
      class="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground"
    >
      {{ t('reader.search.noResults') }}
    </div>

    <div v-else-if="!trimmedInputValue" class="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground">
      {{ t('reader.search.prompt') }}
    </div>

    <template v-else>
      <DynamicScroller
        v-slot="{ item, index, active }"
        class="min-h-0 min-w-0 flex-1 overflow-x-hidden p-2"
        :items="rows"
        :min-item-size="64"
        key-field="id"
        data-testid="epub-search-results"
      >
        <DynamicScrollerItem :item="item" :active="active" :data-index="index" :size-dependencies="[item.result.excerpt.match]">
          <p
            v-if="item.startsSection && item.result.sectionTitle"
            class="px-1 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground first:pt-0"
          >
            {{ item.result.sectionTitle }}
          </p>
          <button
            type="button"
            data-testid="epub-search-result"
            class="mb-1 block w-full min-w-0 rounded-md border border-transparent px-2.5 py-2 text-start text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            :class="props.navigationLocked ? 'cursor-not-allowed opacity-60' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
            :disabled="props.navigationLocked"
            @click="handleNavigate(item.result.cfi)"
          >
            <span class="line-clamp-3 min-w-0 break-words leading-relaxed">
              {{ item.result.excerpt.pre }}<mark class="rounded bg-yellow-300 px-0.5 text-yellow-900">{{ item.result.excerpt.match }}</mark
              >{{ item.result.excerpt.post }}
            </span>
            <span v-if="item.result.sectionTitle" class="mt-1 block truncate text-[11px] text-muted-foreground">
              {{ item.result.sectionTitle }}
            </span>
          </button>
        </DynamicScrollerItem>
      </DynamicScroller>
      <p class="shrink-0 border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
        {{ t('reader.search.resultCount', { count: results.length }) }}
      </p>
    </template>
  </div>
</template>

<style>
@import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
</style>
