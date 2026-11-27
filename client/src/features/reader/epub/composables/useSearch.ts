import { ref } from 'vue'

export const MIN_SEARCH_QUERY_LENGTH = 2

export interface SearchExcerpt {
  pre: string
  match: string
  post: string
}

export interface SearchResult {
  cfi: string
  excerpt: SearchExcerpt
  sectionTitle?: string
}

interface FoliateSearchSection {
  label?: string
  subitems?: { cfi?: string; excerpt?: SearchExcerpt }[]
}

export interface FoliateView {
  search(opts: { query: string }): AsyncIterable<FoliateSearchSection>
  clearSearch?(): void
}

export function useSearch() {
  const query = ref('')
  const results = ref<SearchResult[]>([])
  const isSearching = ref(false)

  let generation = 0

  async function search(view: FoliateView, q: string) {
    const searchId = ++generation
    const normalized = q.trim()
    if (normalized.length < MIN_SEARCH_QUERY_LENGTH) {
      isSearching.value = false
      results.value = []
      query.value = normalized
      view.clearSearch?.()
      return
    }

    await Promise.resolve()
    if (searchId !== generation) return

    query.value = normalized
    results.value = []
    isSearching.value = true

    try {
      const generator = view.search({ query: normalized })
      for await (const section of generator) {
        if (searchId !== generation) break
        if (!section || typeof section !== 'object' || !('subitems' in section)) continue
        const sectionTitle: string = section.label ?? ''
        const newItems: SearchResult[] = (section.subitems ?? []).map((item) => ({
          cfi: item.cfi ?? '',
          sectionTitle,
          excerpt: item.excerpt ?? { pre: '', match: '', post: '' },
        }))
        if (newItems.length > 0) {
          results.value = [...results.value, ...newItems]
        }
      }
    } catch {
      // search cancelled or view destroyed
    } finally {
      if (searchId === generation) {
        isSearching.value = false
      }
    }
  }

  function clear(view: FoliateView | null) {
    generation++
    isSearching.value = false
    results.value = []
    query.value = ''
    view?.clearSearch?.()
  }

  return { query, results, isSearching, search, clear }
}
