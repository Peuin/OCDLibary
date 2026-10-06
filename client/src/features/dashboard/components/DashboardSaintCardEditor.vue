<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { ImagePlus, Loader2 } from '@lucide/vue'

import { DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX, type DashboardFeaturedShelf } from '@bookorbit/types'
import { deleteFeaturedShelfImage, updateFeaturedShelf, uploadFeaturedShelfImage } from '../api/dashboard-featured-shelf.api'
import { useDashboardSharedConfig } from '../composables/useDashboardSharedConfig'

const props = defineProps<{ shelf: DashboardFeaturedShelf }>()

const { t } = useI18n()
const { upsertShelf } = useDashboardSharedConfig()

const busy = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

async function run(task: () => Promise<DashboardFeaturedShelf>) {
  busy.value = true
  try {
    upsertShelf(await task())
  } catch (error) {
    toast.error(error instanceof Error ? error.message : t('dashboard.featured.errors.generic'))
  } finally {
    busy.value = false
  }
}

function handleSaintNameChange(event: Event) {
  const saintName = (event.target as HTMLInputElement).value.trim()
  if (saintName === (props.shelf.saintName ?? '')) return
  void run(() => updateFeaturedShelf(props.shelf.id, { saintName }))
}

function handlePickImage() {
  fileInput.value?.click()
}

function handleImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  void run(() => uploadFeaturedShelfImage(props.shelf.id, file))
}

function handleRemoveImage() {
  void run(() => deleteFeaturedShelfImage(props.shelf.id))
}
</script>

<template>
  <div class="flex items-start gap-3" data-testid="saint-card-editor">
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleImageSelected" />
    <div class="flex shrink-0 flex-col items-center gap-1">
      <button
        type="button"
        class="portrait-frame w-12 rounded-t-[999px] p-[3px] transition-opacity hover:opacity-85 disabled:opacity-50"
        :aria-label="t('dashboard.featured.uploadImage')"
        :title="t('dashboard.featured.uploadImage')"
        :disabled="busy"
        @click="handlePickImage"
      >
        <span class="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-t-[999px] bg-muted text-muted-foreground">
          <img v-if="shelf.imageUrl" :src="shelf.imageUrl" alt="" class="h-full w-full object-cover" />
          <ImagePlus v-else :size="16" aria-hidden="true" />
        </span>
      </button>
      <button
        v-if="shelf.imageUrl"
        type="button"
        class="text-[10px] text-muted-foreground hover:text-destructive disabled:opacity-50"
        :disabled="busy"
        @click="handleRemoveImage"
      >
        {{ t('dashboard.featured.removeImage') }}
      </button>
    </div>

    <div class="min-w-0 flex-1">
      <label class="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {{ t('dashboard.featured.cardLabel') }}
        <Loader2 v-if="busy" :size="11" class="animate-spin" aria-hidden="true" />
      </label>
      <input
        type="text"
        :value="shelf.saintName ?? ''"
        :maxlength="DASHBOARD_FEATURED_SHELF_SAINT_NAME_MAX"
        :placeholder="t('dashboard.featured.saintNamePlaceholder')"
        :aria-label="t('dashboard.featured.saintNameLabel')"
        class="h-8 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        :disabled="busy"
        @change="handleSaintNameChange"
      />
    </div>
  </div>
</template>

<style scoped>
.portrait-frame {
  background: linear-gradient(160deg, var(--saint-frame-gold), color-mix(in oklch, var(--saint-frame-gold) 55%, var(--primary)));
}
</style>
