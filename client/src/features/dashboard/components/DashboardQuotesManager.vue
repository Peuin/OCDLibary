<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { Check, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Search, Trash2, Upload, X } from '@lucide/vue'

import { DASHBOARD_QUOTE_SOURCE_MAX, DASHBOARD_QUOTE_TEXT_MAX, type DashboardQuote } from '@bookorbit/types'
import { useDashboardQuotesAdmin } from '../composables/useDashboardQuotesAdmin'

const { t } = useI18n()
const {
  items,
  total,
  page,
  pageCount,
  loading,
  importing,
  importResult,
  load,
  setSearch,
  goToPage,
  create,
  update,
  remove,
  importFile,
  clearImportResult,
} = useDashboardQuotesAdmin()

const newText = ref('')
const newSource = ref('')
const creating = ref(false)
const editingId = ref<number | null>(null)
const editText = ref('')
const editSource = ref('')
const busyIds = reactive(new Set<number>())
const fileInput = ref<HTMLInputElement | null>(null)
let searchTimer: number | null = null

onMounted(() => {
  void load().catch(handleError)
})

function handleError(error: unknown) {
  toast.error(error instanceof Error ? error.message : t('dashboard.quotes.errors.generic'))
}

function handleSearchInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (searchTimer !== null) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    void setSearch(value).catch(handleError)
  }, 300)
}

async function handleCreate() {
  const text = newText.value.trim()
  const source = newSource.value.trim()
  if (!text || !source) {
    toast.error(t('dashboard.quotes.errors.required'))
    return
  }
  creating.value = true
  try {
    await create(text, source)
    newText.value = ''
    newSource.value = ''
    toast.success(t('dashboard.quotes.toasts.added'))
  } catch (error) {
    handleError(error)
  } finally {
    creating.value = false
  }
}

function startEdit(quote: DashboardQuote) {
  editingId.value = quote.id
  editText.value = quote.text
  editSource.value = quote.source
}

function cancelEdit() {
  editingId.value = null
}

async function runBusy(id: number, action: () => Promise<void>) {
  busyIds.add(id)
  try {
    await action()
  } catch (error) {
    handleError(error)
  } finally {
    busyIds.delete(id)
  }
}

function saveEdit(quote: DashboardQuote) {
  const text = editText.value.trim()
  const source = editSource.value.trim()
  if (!text || !source) {
    toast.error(t('dashboard.quotes.errors.required'))
    return
  }
  void runBusy(quote.id, async () => {
    await update(quote.id, { text, source })
    editingId.value = null
  })
}

function toggleEnabled(quote: DashboardQuote) {
  void runBusy(quote.id, () => update(quote.id, { enabled: !quote.enabled }))
}

function deleteQuote(quote: DashboardQuote) {
  if (!window.confirm(t('dashboard.quotes.confirmDelete', { source: quote.source }))) return
  void runBusy(quote.id, () => remove(quote.id))
}

function openFilePicker() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const result = await importFile(file)
    if (result.errors.length === 0) toast.success(t('dashboard.quotes.import.success', { count: result.imported }, result.imported))
    else toast.warning(t('dashboard.quotes.import.partial', { count: result.errors.length }, result.errors.length))
  } catch (error) {
    handleError(error)
  }
}

function errorLineLabel(line: number, code: string): string {
  return t('dashboard.quotes.import.lineError', { line, reason: t(`dashboard.quotes.import.codes.${code}`) })
}

function handlePrevPage() {
  void goToPage(page.value - 1).catch(handleError)
}

function handleNextPage() {
  void goToPage(page.value + 1).catch(handleError)
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-xs text-muted-foreground">{{ t('dashboard.quotes.hint') }}</p>

    <!-- Add -->
    <form class="space-y-2 rounded-lg border border-border bg-card p-3" @submit.prevent="handleCreate">
      <label class="block text-xs font-medium text-foreground" for="dashboard-quote-new-text">{{ t('dashboard.quotes.textLabel') }}</label>
      <textarea
        id="dashboard-quote-new-text"
        v-model="newText"
        rows="2"
        :maxlength="DASHBOARD_QUOTE_TEXT_MAX"
        class="w-full resize-y rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div class="flex items-end gap-2">
        <div class="min-w-0 grow">
          <label class="block text-xs font-medium text-foreground" for="dashboard-quote-new-source">{{ t('dashboard.quotes.sourceLabel') }}</label>
          <input
            id="dashboard-quote-new-source"
            v-model="newSource"
            :maxlength="DASHBOARD_QUOTE_SOURCE_MAX"
            :placeholder="t('dashboard.quotes.sourcePlaceholder')"
            class="mt-1 h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button
          type="submit"
          class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          :disabled="creating"
        >
          <Loader2 v-if="creating" :size="14" class="animate-spin" aria-hidden="true" />
          <Plus v-else :size="14" aria-hidden="true" />
          {{ t('dashboard.quotes.add') }}
        </button>
      </div>
    </form>

    <!-- Import -->
    <div class="rounded-lg border border-border bg-card p-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-medium text-foreground">{{ t('dashboard.quotes.import.title') }}</p>
          <p class="mt-1 text-xs text-muted-foreground">{{ t('dashboard.quotes.import.formatTxt') }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">{{ t('dashboard.quotes.import.formatCsv') }}</p>
        </div>
        <button
          type="button"
          class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-input px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          :disabled="importing"
          @click="openFilePicker"
        >
          <Loader2 v-if="importing" :size="14" class="animate-spin" aria-hidden="true" />
          <Upload v-else :size="14" aria-hidden="true" />
          {{ t('dashboard.quotes.import.choose') }}
        </button>
        <input
          ref="fileInput"
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          class="hidden"
          data-testid="dashboard-quote-file"
          @change="handleFileChange"
        />
      </div>

      <div
        v-if="importResult"
        class="mt-3 rounded-md border border-border bg-background p-2.5 text-xs"
        role="status"
        data-testid="dashboard-quote-import-result"
      >
        <div class="flex items-start justify-between gap-2">
          <p class="text-foreground">
            {{
              t('dashboard.quotes.import.summary', {
                imported: importResult.imported,
                skipped: importResult.skippedDuplicates,
                errors: importResult.errors.length,
              })
            }}
          </p>
          <button
            type="button"
            class="shrink-0 text-muted-foreground hover:text-foreground"
            :aria-label="t('common.close')"
            @click="clearImportResult"
          >
            <X :size="14" aria-hidden="true" />
          </button>
        </div>
        <ul v-if="importResult.errors.length > 0" class="mt-2 max-h-40 space-y-0.5 overflow-y-auto text-destructive">
          <li v-for="error in importResult.errors" :key="error.line">{{ errorLineLabel(error.line, error.code) }}</li>
        </ul>
      </div>
    </div>

    <!-- List -->
    <div>
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm font-medium text-foreground">{{ t('dashboard.quotes.listTitle', { count: total }, total) }}</p>
        <Loader2 v-if="loading" :size="14" class="animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
      <div class="relative mt-2">
        <Search :size="14" class="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          :placeholder="t('dashboard.quotes.searchPlaceholder')"
          :aria-label="t('dashboard.quotes.searchPlaceholder')"
          class="h-8 w-full rounded-md border border-input bg-background ps-8 pe-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          @input="handleSearchInput"
        />
      </div>

      <p v-if="!loading && items.length === 0" class="py-6 text-center text-xs text-muted-foreground">{{ t('dashboard.quotes.empty') }}</p>

      <ul class="mt-2 space-y-2">
        <li v-for="quote in items" :key="quote.id" class="rounded-lg border border-border bg-card p-3" :class="{ 'opacity-60': !quote.enabled }">
          <div v-if="editingId === quote.id" class="space-y-2">
            <textarea
              v-model="editText"
              rows="2"
              :maxlength="DASHBOARD_QUOTE_TEXT_MAX"
              :aria-label="t('dashboard.quotes.textLabel')"
              class="w-full resize-y rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div class="flex items-center gap-2">
              <input
                v-model="editSource"
                :maxlength="DASHBOARD_QUOTE_SOURCE_MAX"
                :aria-label="t('dashboard.quotes.sourceLabel')"
                class="h-8 min-w-0 grow rounded-md border border-input bg-background px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                :aria-label="t('common.save')"
                :disabled="busyIds.has(quote.id)"
                @click="saveEdit(quote)"
              >
                <Check :size="14" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-muted hover:text-foreground"
                :aria-label="t('common.cancel')"
                @click="cancelEdit"
              >
                <X :size="14" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div v-else class="flex items-start gap-3">
            <button
              type="button"
              role="switch"
              class="relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              :class="quote.enabled ? 'bg-primary' : 'bg-muted-foreground/30'"
              :aria-checked="quote.enabled"
              :aria-label="t('dashboard.quotes.toggle')"
              :disabled="busyIds.has(quote.id)"
              @click="toggleEnabled(quote)"
            >
              <span
                class="pointer-events-none block h-4 w-4 rounded-full bg-background shadow ring-0 transition-transform duration-200"
                :class="quote.enabled ? 'translate-x-4' : 'translate-x-0'"
              />
            </button>
            <div class="min-w-0 grow">
              <p class="break-words text-sm text-foreground">{{ quote.text }}</p>
              <p class="mt-0.5 text-xs font-semibold text-primary">({{ quote.source }})</p>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <button
                type="button"
                class="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                :aria-label="t('dashboard.quotes.edit')"
                @click="startEdit(quote)"
              >
                <Pencil :size="14" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                :aria-label="t('dashboard.quotes.delete')"
                :disabled="busyIds.has(quote.id)"
                @click="deleteQuote(quote)"
              >
                <Trash2 :size="14" aria-hidden="true" />
              </button>
            </div>
          </div>
        </li>
      </ul>

      <div v-if="pageCount > 1" class="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <button
          type="button"
          class="inline-flex h-7 items-center gap-1 rounded-md px-2 hover:bg-muted hover:text-foreground disabled:opacity-40"
          :disabled="page <= 1 || loading"
          @click="handlePrevPage"
        >
          <ChevronLeft :size="14" aria-hidden="true" />
          {{ t('dashboard.quotes.prev') }}
        </button>
        <span>{{ t('dashboard.quotes.pageOf', { page, pages: pageCount }) }}</span>
        <button
          type="button"
          class="inline-flex h-7 items-center gap-1 rounded-md px-2 hover:bg-muted hover:text-foreground disabled:opacity-40"
          :disabled="page >= pageCount || loading"
          @click="handleNextPage"
        >
          {{ t('dashboard.quotes.next') }}
          <ChevronRight :size="14" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>
