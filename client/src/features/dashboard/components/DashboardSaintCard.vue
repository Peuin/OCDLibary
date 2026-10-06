<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { BookOpen, UserRound } from '@lucide/vue'

defineProps<{
  saintName: string | null
  imageUrl: string | null
  /** Hidden where the card already sits inside the full shelf it would open. */
  showAction?: boolean
}>()

const emit = defineEmits<{ 'view-works': [] }>()

const { t } = useI18n()

function handleViewWorks() {
  emit('view-works')
}
</script>

<template>
  <article class="saint-card flex w-[224px] shrink-0 flex-col items-center rounded-t-[999px] p-2 pb-4 text-center">
    <div class="saint-frame w-full rounded-t-[999px] p-[5px]">
      <!-- 7:8 keeps the wider card level with a row of 200px-wide covers and their ledge. -->
      <div class="aspect-[7/8] w-full overflow-hidden rounded-t-[999px] bg-muted">
        <img v-if="imageUrl" :src="imageUrl" :alt="saintName ?? ''" class="h-full w-full object-cover" loading="lazy" />
        <div v-else class="flex h-full w-full items-center justify-center text-muted-foreground">
          <UserRound :size="36" aria-hidden="true" />
        </div>
      </div>
    </div>
    <p v-if="saintName" :title="saintName" class="mt-2 line-clamp-3 font-serif text-[13px] font-bold leading-snug text-foreground">
      {{ saintName }}
    </p>
    <span class="min-h-2 flex-1" aria-hidden="true" />
    <button
      v-if="showAction"
      type="button"
      class="saint-action mt-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      @click="handleViewWorks"
    >
      <BookOpen :size="12" aria-hidden="true" />
      {{ t('dashboard.featured.viewWorks') }}
    </button>
  </article>
</template>

<style scoped>
/* A cream card with a gilt edge; the portrait sits in a gilt arch inside it. The card stands on
   the shelf's bottom edge, so it has no bottom border of its own. */
.saint-card {
  background: color-mix(in oklch, var(--card) 92%, transparent);
  border: 1px solid var(--saint-frame-gold);
  border-bottom: 0;
  box-shadow: var(--elevation-md);
}

.saint-frame {
  background: linear-gradient(160deg, var(--saint-frame-gold), color-mix(in oklch, var(--saint-frame-gold) 60%, var(--primary)));
}

.saint-action {
  background: var(--primary);
  color: var(--primary-foreground);
}
</style>
