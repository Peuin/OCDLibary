<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentState } from '@embedpdf/core/vue'
import { useSearch } from '@embedpdf/plugin-search/vue'
import type { Rect } from '@embedpdf/models'
import { mergeLineRects } from '../utils/searchRects'

const props = defineProps<{
  documentId: string
  pageIndex: number
  scale?: number
}>()

const documentState = useDocumentState(() => props.documentId)
const { state: searchState } = useSearch(() => props.documentId)

const actualScale = computed(() => props.scale ?? documentState.value?.scale ?? 1)

interface HighlightBox {
  key: string
  rect: Rect
  active: boolean
}

const highlights = computed<HighlightBox[]>(() => {
  if (!searchState.value.active) return []
  return searchState.value.results
    .map((result, originalIndex) => ({ result, originalIndex }))
    .filter(({ result }) => result.pageIndex === props.pageIndex)
    .filter(({ originalIndex }) => searchState.value.showAllResults || originalIndex === searchState.value.activeResultIndex)
    .flatMap(({ result, originalIndex }) =>
      mergeLineRects(result.rects).map((rect, rectIndex) => ({
        key: `${originalIndex}-${rectIndex}`,
        rect,
        active: originalIndex === searchState.value.activeResultIndex,
      })),
    )
})

function highlightStyle(highlight: HighlightBox) {
  return {
    top: `${highlight.rect.origin.y * actualScale.value}px`,
    left: `${highlight.rect.origin.x * actualScale.value}px`,
    width: `${highlight.rect.size.width * actualScale.value}px`,
    height: `${highlight.rect.size.height * actualScale.value}px`,
  }
}
</script>

<template>
  <div v-if="highlights.length > 0" class="pointer-events-none" data-testid="pdf-search-highlight-layer">
    <div
      v-for="highlight in highlights"
      :key="highlight.key"
      class="pdf-search-hit"
      :class="{ 'pdf-search-hit-active': highlight.active }"
      :style="highlightStyle(highlight)"
    />
  </div>
</template>

<style scoped>
.pdf-search-hit {
  position: absolute;
  border-radius: 2px;
  background: var(--reader-search-hit);
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}

.pdf-search-hit-active {
  background: var(--reader-search-hit-active);
  outline: 1px solid var(--reader-search-hit-active-outline);
}
</style>
