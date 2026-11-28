<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Pencil } from '@lucide/vue'
import type { Collection } from '@bookorbit/types'
import { canMutateCollection } from '../lib/collection-access'

const props = defineProps<{
  collection: Collection | null
  position: { x: number; y: number } | null
}>()

const emit = defineEmits<{
  edit: [collection: Collection]
  close: []
}>()

const { t } = useI18n()
const menuRef = ref<HTMLElement | null>(null)
const menuSize = ref({ width: 180, height: 48 })
const canEdit = computed(() => canMutateCollection(props.collection))

const adjustedX = computed(() => {
  if (!props.position) return 0
  return Math.max(8, Math.min(props.position.x, window.innerWidth - menuSize.value.width - 8))
})

const adjustedY = computed(() => {
  if (!props.position) return 0
  return Math.max(8, Math.min(props.position.y, window.innerHeight - menuSize.value.height - 8))
})

function closeMenu() {
  emit('close')
}

async function measureMenu() {
  await nextTick()
  if (!menuRef.value) return
  menuSize.value = { width: menuRef.value.offsetWidth, height: menuRef.value.offsetHeight }
}

function handleDocumentClick(event: MouseEvent) {
  if (!props.position) return
  if (menuRef.value?.contains(event.target as Node | null)) return
  closeMenu()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !props.position) return
  event.preventDefault()
  closeMenu()
}

function handleScroll() {
  if (props.position) closeMenu()
}

function handleEdit() {
  if (!props.collection || !canEdit.value) return
  emit('edit', props.collection)
  closeMenu()
}

watch(
  () => props.position,
  (position) => {
    if (position) void measureMenu()
  },
)

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', handleScroll)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleScroll)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="collection && position && canEdit"
      ref="menuRef"
      role="menu"
      class="fixed z-[100] min-w-[180px] rounded-md border border-border bg-popover p-1 shadow-md"
      :style="{ top: `${adjustedY}px`, left: `${adjustedX}px` }"
    >
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
        @click="handleEdit"
      >
        <Pencil :size="14" aria-hidden="true" />
        {{ t('views.collection.editCollection') }}
      </button>
    </div>
  </Teleport>
</template>
