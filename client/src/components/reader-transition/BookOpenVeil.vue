<script setup lang="ts">
import { computed } from 'vue'
import { BOOK_OPEN_TRANSITION_NAME, useBookOpenTransition } from '@/composables/useBookOpenTransition'

// Full-screen surface the opened cover grows into (SCRUM-102). It lives outside the router
// view so it mounts at once inside the view transition, then fades off the reader.
const { veilVisible, coverTransitionActive, backFallbackActive, backFallbackStyle } = useBookOpenTransition()
const veilStyle = computed(() => {
  const style: Record<string, string> = {}
  if (coverTransitionActive.value) style.viewTransitionName = BOOK_OPEN_TRANSITION_NAME
  if (backFallbackStyle.value) Object.assign(style, backFallbackStyle.value)
  return style
})
</script>

<template>
  <Transition name="book-open-veil">
    <div
      v-if="veilVisible"
      class="book-open-veil bg-background"
      :class="{ 'book-open-veil--back-fallback': backFallbackActive }"
      aria-hidden="true"
      :style="veilStyle"
    />
  </Transition>
</template>
