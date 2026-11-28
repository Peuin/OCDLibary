import { computed, ref } from 'vue'

import type { DashboardQuote, DashboardQuoteImportResult } from '@bookorbit/types'
import {
  createDashboardQuote,
  deleteDashboardQuote,
  fetchDashboardQuotes,
  importDashboardQuotes,
  updateDashboardQuote,
} from '../api/dashboard-quote.api'

export const DASHBOARD_QUOTES_ADMIN_PAGE_SIZE = 20

export function useDashboardQuotesAdmin() {
  const items = ref<DashboardQuote[]>([])
  const total = ref(0)
  const page = ref(1)
  const search = ref('')
  const loading = ref(false)
  const importing = ref(false)
  const importResult = ref<DashboardQuoteImportResult | null>(null)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / DASHBOARD_QUOTES_ADMIN_PAGE_SIZE)))
  let requestId = 0

  async function load() {
    const current = ++requestId
    loading.value = true
    try {
      const result = await fetchDashboardQuotes({
        page: page.value,
        pageSize: DASHBOARD_QUOTES_ADMIN_PAGE_SIZE,
        search: search.value.trim() || undefined,
      })
      if (current !== requestId) return
      items.value = result.items
      total.value = result.total
      if (result.items.length === 0 && page.value > 1 && result.total > 0) {
        page.value = Math.ceil(result.total / DASHBOARD_QUOTES_ADMIN_PAGE_SIZE)
        await load()
      }
    } finally {
      if (current === requestId) loading.value = false
    }
  }

  function setSearch(value: string) {
    search.value = value
    page.value = 1
    return load()
  }

  function goToPage(next: number) {
    page.value = Math.min(Math.max(1, next), pageCount.value)
    return load()
  }

  async function create(text: string, source: string) {
    await createDashboardQuote({ text, source })
    page.value = 1
    await load()
  }

  async function update(id: number, patch: { text?: string; source?: string; enabled?: boolean }) {
    const updated = await updateDashboardQuote(id, patch)
    items.value = items.value.map((item) => (item.id === id ? updated : item))
  }

  async function remove(id: number) {
    await deleteDashboardQuote(id)
    await load()
  }

  async function importFile(file: File) {
    importing.value = true
    importResult.value = null
    try {
      importResult.value = await importDashboardQuotes(file)
      page.value = 1
      await load()
      return importResult.value
    } finally {
      importing.value = false
    }
  }

  function clearImportResult() {
    importResult.value = null
  }

  return {
    items,
    total,
    page,
    pageCount,
    search,
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
  }
}
