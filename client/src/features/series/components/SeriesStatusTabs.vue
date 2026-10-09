<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SeriesFacets } from '@bookorbit/types'
import { formatNumber } from '@/i18n/formatters'
import type { CompletionStatus } from '../types/series'

/**
 * Counts come from the server for the whole library, not from the loaded page, so the tab a
 * reader is standing on can still say what the others hold across tens of thousands of series.
 */
const props = defineProps<{
  status: CompletionStatus | null
  facets: SeriesFacets
}>()

const emit = defineEmits<{
  select: [status: CompletionStatus | null]
}>()

const { t } = useI18n()

const tabs = computed(() => [
  { value: null, label: t('series.status.all'), count: props.facets.all },
  { value: 'in_progress' as const, label: t('series.status.reading'), count: props.facets.inProgress },
  { value: 'not_started' as const, label: t('series.status.unread'), count: props.facets.notStarted },
  { value: 'complete' as const, label: t('series.status.complete'), count: props.facets.complete },
  { value: 'has_gaps' as const, label: t('series.status.gaps'), count: props.facets.hasGaps },
])

const strip = ref<HTMLElement | null>(null)
const overflowing = ref(false)
let stripObserver: ResizeObserver | null = null

function measureOverflow() {
  const el = strip.value
  overflowing.value = !!el && el.scrollWidth > el.clientWidth + 1
}

function handleSelect(value: CompletionStatus | null) {
  emit('select', value)
}

onMounted(() => {
  if (!strip.value) return
  stripObserver = new ResizeObserver(measureOverflow)
  stripObserver.observe(strip.value)
  for (const child of strip.value.children) stripObserver.observe(child)
})

onBeforeUnmount(() => {
  stripObserver?.disconnect()
})
</script>

<template>
  <div
    ref="strip"
    class="status-tabs flex min-w-0 max-w-full gap-1 overflow-x-auto rounded-xl bg-muted p-1"
    :data-overflowing="overflowing || undefined"
    role="tablist"
    :aria-label="t('series.status.label')"
  >
    <button
      v-for="tab in tabs"
      :key="tab.value ?? 'all'"
      type="button"
      role="tab"
      class="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] leading-normal transition-colors"
      :class="props.status === tab.value ? 'bg-background font-semibold text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
      :aria-selected="props.status === tab.value"
      @click="handleSelect(tab.value)"
    >
      {{ tab.label }}
      <span
        class="grid h-[18px] min-w-[19px] place-items-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums"
        :class="props.status === tab.value ? 'bg-primary/12 text-foreground' : 'bg-surface-4 text-muted-foreground'"
      >
        {{ formatNumber(tab.count) }}
      </span>
    </button>
  </div>
</template>

<style scoped>
/* Scrolls whenever its container is narrower than the five tabs, not only on small viewports:
   the strip shares a wrapping row with filters, so the space it gets depends on more than the window. */
.status-tabs {
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.status-tabs::-webkit-scrollbar {
  display: none;
}

.status-tabs[data-overflowing] {
  mask-image: linear-gradient(90deg, #000 calc(100% - 22px), transparent 100%);
}
</style>
