<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { BookOpen, UserRound } from '@lucide/vue'

defineProps<{
  saintName: string | null
  imageUrl: string | null
  collectionId: number
}>()

const { t } = useI18n()
</script>

<template>
  <article class="saint-card flex w-[156px] shrink-0 flex-col items-center rounded-t-[999px] rounded-b-xl p-2 pb-3 text-center">
    <div class="saint-frame w-full rounded-t-[999px] p-[5px]">
      <div class="aspect-[3/4] w-full overflow-hidden rounded-t-[999px] bg-muted">
        <img v-if="imageUrl" :src="imageUrl" :alt="saintName ?? ''" class="h-full w-full object-cover" loading="lazy" />
        <div v-else class="flex h-full w-full items-center justify-center text-muted-foreground">
          <UserRound :size="36" aria-hidden="true" />
        </div>
      </div>
    </div>
    <p v-if="saintName" class="mt-2 line-clamp-3 font-serif text-[13px] font-bold leading-snug text-foreground">{{ saintName }}</p>
    <RouterLink
      :to="{ name: 'collection', params: { id: collectionId } }"
      class="mt-2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <BookOpen :size="12" aria-hidden="true" />
      {{ t('dashboard.featured.viewWorks') }}
    </RouterLink>
  </article>
</template>

<style scoped>
.saint-card {
  background: color-mix(in oklch, var(--card) 92%, transparent);
  border: 1px solid var(--saint-frame-gold);
  box-shadow: var(--elevation-md);
}

.saint-frame {
  background: linear-gradient(160deg, var(--saint-frame-gold), color-mix(in oklch, var(--saint-frame-gold) 55%, var(--primary)));
}
</style>
