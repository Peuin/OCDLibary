<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { UserRound } from '@lucide/vue'

const props = defineProps<{
  saintName: string | null
  imageUrl: string | null
  /** Hidden where the card already sits inside the full shelf it would open. */
  showAction?: boolean
}>()

const emit = defineEmits<{ 'view-works': [] }>()

const { t } = useI18n()

// "Thánh Têrêsa Avila - Tiến sĩ Hội Thánh" reads as a name over its title, as on a holy card.
const nameParts = computed(() => {
  const full = props.saintName?.trim() ?? ''
  const separator = full.indexOf(' - ')
  if (separator < 0) return { name: full, title: '' }
  return { name: full.slice(0, separator).trim(), title: full.slice(separator + 3).trim() }
})

function handleViewWorks() {
  emit('view-works')
}
</script>

<template>
  <!-- 160:232 as in the design, so the card stands well above the 2:3 covers beside it. -->
  <article class="saint-vault relative aspect-[160/232] w-[200px] shrink-0 overflow-hidden">
    <img v-if="imageUrl" :src="imageUrl" :alt="saintName ?? ''" class="absolute inset-0 h-full w-full object-cover object-top" loading="lazy" />
    <div v-else class="absolute inset-0 flex items-start justify-center pt-16 text-[var(--saint-caption)]/60">
      <UserRound :size="48" aria-hidden="true" />
    </div>
    <div class="saint-shade absolute inset-0" aria-hidden="true" />

    <div class="relative flex h-full flex-col justify-end gap-1 p-3 text-center">
      <p v-if="nameParts.name" :title="saintName ?? ''" class="line-clamp-2 font-serif text-[15px] font-bold leading-tight text-white drop-shadow-md">
        {{ nameParts.name }}
      </p>
      <p v-if="nameParts.title" class="line-clamp-1 text-[11px] font-medium text-[var(--saint-caption)]">{{ nameParts.title }}</p>
      <button
        v-if="showAction"
        type="button"
        class="saint-action mt-1.5 w-full rounded-md py-1.5 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saint-glow)]"
        @click="handleViewWorks"
      >
        {{ t('dashboard.featured.viewWorks') }}
      </button>
    </div>
  </article>
</template>

<style scoped>
/* A dark arched vault, the portrait filling it edge to edge, ringed by a bronze glow. */
.saint-vault {
  border-radius: 100px 100px 16px 16px;
  background: var(--saint-card-ink);
  border: 2px solid var(--saint-glow);
  box-shadow:
    0 0 12px color-mix(in oklch, var(--saint-glow) 75%, transparent),
    0 0 28px color-mix(in oklch, var(--saint-glow) 45%, transparent),
    inset 0 0 14px color-mix(in oklch, var(--saint-glow) 40%, transparent);
}

.saint-vault::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 97px 97px 13px 13px;
  outline: 1.5px solid color-mix(in oklch, var(--saint-glow) 75%, white 10%);
  pointer-events: none;
}

.saint-shade {
  background: linear-gradient(
    to top,
    color-mix(in oklch, var(--saint-card-ink) 96%, black) 0%,
    color-mix(in oklch, var(--saint-card-ink) 60%, transparent) 38%,
    transparent 65%
  );
}

.saint-action {
  background: color-mix(in oklch, var(--saint-action) 90%, transparent);
  border: 1px solid color-mix(in oklch, var(--saint-frame-gold) 70%, transparent);
}
</style>
