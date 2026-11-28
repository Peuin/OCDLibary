import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchRandomDashboardQuote = vi.fn<(excludeId: number | null) => Promise<unknown>>()
vi.mock('../../api/dashboard-quote.api', () => ({ fetchRandomDashboardQuote: (excludeId: number | null) => fetchRandomDashboardQuote(excludeId) }))

const { LAST_QUOTE_STORAGE_KEY, useDashboardQuote } = await import('../useDashboardQuote')

describe('useDashboardQuote', () => {
  beforeEach(() => {
    localStorage.clear()
    fetchRandomDashboardQuote.mockReset()
  })

  it('asks for a quote other than the last one shown and remembers the new one', async () => {
    localStorage.setItem(LAST_QUOTE_STORAGE_KEY, '3')
    fetchRandomDashboardQuote.mockResolvedValue({ quote: { id: 7, text: 'Lúc khởi đầu', source: 'Ga 1,1' } })

    const { quote, loadQuote } = useDashboardQuote()
    await loadQuote()

    expect(fetchRandomDashboardQuote).toHaveBeenCalledWith(3)
    expect(quote.value).toEqual({ id: 7, text: 'Lúc khởi đầu', source: 'Ga 1,1' })
    expect(localStorage.getItem(LAST_QUOTE_STORAGE_KEY)).toBe('7')
  })

  it('sends no exclusion on a first visit', async () => {
    fetchRandomDashboardQuote.mockResolvedValue({ quote: null })
    const { quote, loadQuote } = useDashboardQuote()
    await loadQuote()
    expect(fetchRandomDashboardQuote).toHaveBeenCalledWith(null)
    expect(quote.value).toBeNull()
    expect(localStorage.getItem(LAST_QUOTE_STORAGE_KEY)).toBeNull()
  })

  it('shows nothing when the request fails', async () => {
    fetchRandomDashboardQuote.mockRejectedValue(new Error('offline'))
    const { quote, loadQuote } = useDashboardQuote()
    await loadQuote()
    expect(quote.value).toBeNull()
  })
})
