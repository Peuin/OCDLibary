import { ref } from 'vue'

import type { DashboardQuoteDisplay } from '@bookorbit/types'
import { fetchRandomDashboardQuote } from '../api/dashboard-quote.api'

export const LAST_QUOTE_STORAGE_KEY = 'bookorbit:dashboard:last-quote-id'

function readLastQuoteId(): number | null {
  try {
    const value = Number(localStorage.getItem(LAST_QUOTE_STORAGE_KEY))
    return Number.isInteger(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function writeLastQuoteId(id: number) {
  try {
    localStorage.setItem(LAST_QUOTE_STORAGE_KEY, String(id))
  } catch {
    // Storage can be unavailable (private mode, quota); the server still picks a quote.
  }
}

/** One random quote per dashboard visit; the server skips the one shown last time. */
export function useDashboardQuote() {
  const quote = ref<DashboardQuoteDisplay | null>(null)

  async function loadQuote() {
    try {
      const { quote: next } = await fetchRandomDashboardQuote(readLastQuoteId())
      quote.value = next
      if (next) writeLastQuoteId(next.id)
    } catch {
      quote.value = null
    }
  }

  return { quote, loadQuote }
}
