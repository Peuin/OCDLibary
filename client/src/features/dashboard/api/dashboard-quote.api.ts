import type {
  CreateDashboardQuoteRequest,
  DashboardQuote,
  DashboardQuoteImportResult,
  DashboardQuotePage,
  DashboardRandomQuoteResponse,
  UpdateDashboardQuoteRequest,
} from '@bookorbit/types'
import { api } from '@/lib/api'

const BASE = '/api/v1/dashboard/quotes'

async function readJson<T>(response: Response, failure: string): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: unknown } | null
    throw new Error(typeof body?.message === 'string' ? body.message : failure)
  }
  return (await response.json()) as T
}

function jsonRequest(method: string, body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

export async function fetchRandomDashboardQuote(excludeId: number | null): Promise<DashboardRandomQuoteResponse> {
  const query = excludeId === null ? '' : `?excludeId=${excludeId}`
  return readJson(await api(`${BASE}/random${query}`), 'Failed to load a quote')
}

export async function fetchDashboardQuotes(params: { page: number; pageSize: number; search?: string }): Promise<DashboardQuotePage> {
  const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) })
  if (params.search) query.set('search', params.search)
  return readJson(await api(`${BASE}?${query.toString()}`), 'Failed to load quotes')
}

export async function createDashboardQuote(body: CreateDashboardQuoteRequest): Promise<DashboardQuote> {
  return readJson(await api(BASE, jsonRequest('POST', body)), 'Failed to add the quote')
}

export async function updateDashboardQuote(id: number, body: UpdateDashboardQuoteRequest): Promise<DashboardQuote> {
  return readJson(await api(`${BASE}/${id}`, jsonRequest('PATCH', body)), 'Failed to update the quote')
}

export async function deleteDashboardQuote(id: number): Promise<void> {
  const response = await api(`${BASE}/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Failed to delete the quote')
}

export async function importDashboardQuotes(file: File): Promise<DashboardQuoteImportResult> {
  const form = new FormData()
  form.append('file', file)
  return readJson(await api(`${BASE}/import`, { method: 'POST', body: form }), 'Failed to import the quotes')
}
