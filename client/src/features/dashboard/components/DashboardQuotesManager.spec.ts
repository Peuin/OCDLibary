import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { DashboardQuoteImportResult, DashboardQuotePage } from '@bookorbit/types'

import { setI18nLocale } from '@/i18n'

const api = vi.hoisted(() => ({
  fetchDashboardQuotes: vi.fn<() => Promise<DashboardQuotePage>>(),
  importDashboardQuotes: vi.fn<(file: File) => Promise<DashboardQuoteImportResult>>(),
  updateDashboardQuote: vi.fn<(id: number, body: { enabled?: boolean }) => Promise<unknown>>(),
  createDashboardQuote: vi.fn<() => Promise<unknown>>(),
  deleteDashboardQuote: vi.fn<() => Promise<void>>(),
}))

vi.mock('../api/dashboard-quote.api', () => api)
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn<() => void>(), error: vi.fn<() => void>(), warning: vi.fn<() => void>() } }))

import DashboardQuotesManager from './DashboardQuotesManager.vue'

const quote = { id: 1, text: 'Lúc khởi đầu đã có Ngôi Lời', source: 'Ga 1,1', enabled: true, createdAt: '', updatedAt: '' }

beforeEach(async () => {
  vi.clearAllMocks()
  api.fetchDashboardQuotes.mockResolvedValue({ items: [quote], total: 1, page: 1, pageSize: 20 })
  await setI18nLocale('vi')
})

describe('DashboardQuotesManager', () => {
  it('lists quotes with their source', async () => {
    const wrapper = mount(DashboardQuotesManager)
    await flushPromises()
    expect(wrapper.text()).toContain('Lúc khởi đầu đã có Ngôi Lời')
    expect(wrapper.text()).toContain('(Ga 1,1)')
  })

  it('toggles a quote on and off', async () => {
    api.updateDashboardQuote.mockResolvedValue({ ...quote, enabled: false })
    const wrapper = mount(DashboardQuotesManager)
    await flushPromises()

    await wrapper.find('[role="switch"]').trigger('click')
    await flushPromises()

    expect(api.updateDashboardQuote).toHaveBeenCalledWith(1, { enabled: false })
    expect(wrapper.find('[role="switch"]').attributes('aria-checked')).toBe('false')
  })

  it('reports each bad row of an uploaded file by its line number', async () => {
    api.importDashboardQuotes.mockResolvedValue({
      imported: 98,
      skippedDuplicates: 0,
      errors: [
        { line: 12, code: 'missing_source' },
        { line: 57, code: 'unclosed_quote' },
      ],
    })
    const wrapper = mount(DashboardQuotesManager)
    await flushPromises()

    const input = wrapper.find('[data-testid="dashboard-quote-file"]')
    Object.defineProperty(input.element, 'files', { value: [new File(['x'], 'quotes.csv')], configurable: true })
    await input.trigger('change')
    await flushPromises()

    const result = wrapper.find('[data-testid="dashboard-quote-import-result"]').text()
    expect(result).toContain('Đã thêm 98 câu')
    expect(result).toContain('Dòng 12: thiếu nguồn trích')
    expect(result).toContain('Dòng 57: có dấu ngoặc kép chưa đóng')
  })
})
