import {
  DASHBOARD_SHELF_BOOKS_MAX,
  type AddDashboardShelfBooksRequest,
  type AddDashboardShelfBooksResponse,
  type CreateDashboardFeaturedShelfRequest,
  type DashboardDefaultLayout,
  type DashboardFeaturedShelf,
  type DashboardScrollerBatchRequest,
  type DashboardScrollerBatchResponse,
  type DashboardSharedConfig,
  type ReorderDashboardFeaturedShelvesRequest,
  type UpdateDashboardFeaturedShelfRequest,
} from '@bookorbit/types'
import { api } from '@/lib/api'

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

export async function fetchDashboardSharedConfig(): Promise<DashboardSharedConfig> {
  return readJson(await api('/api/v1/dashboard/shared-config'), 'Failed to load the shared dashboard configuration')
}

export async function createFeaturedShelf(body: CreateDashboardFeaturedShelfRequest): Promise<DashboardFeaturedShelf> {
  return readJson(await api('/api/v1/dashboard/featured-shelves', jsonRequest('POST', body)), 'Failed to create the shelf')
}

export async function updateFeaturedShelf(id: number, body: UpdateDashboardFeaturedShelfRequest): Promise<DashboardFeaturedShelf> {
  return readJson(await api(`/api/v1/dashboard/featured-shelves/${id}`, jsonRequest('PATCH', body)), 'Failed to update the shelf')
}

export async function fetchFeaturedShelfBookCount(shelfId: number): Promise<number> {
  const body: DashboardScrollerBatchRequest = {
    items: [{ id: `featured-shelf-${shelfId}`, type: 'featured-shelf', limit: DASHBOARD_SHELF_BOOKS_MAX, featuredShelfId: shelfId }],
  }
  const payload = await readJson<DashboardScrollerBatchResponse>(
    await api('/api/v1/dashboard/scrollers/batch', jsonRequest('POST', body)),
    'Failed to load the shelf books',
  )
  const result = payload.items.find((item) => item.id === `featured-shelf-${shelfId}`)
  if (!result || result.failed) throw new Error('Failed to load the shelf books')
  return result.books.length
}

export async function reorderFeaturedShelves(ids: number[]): Promise<DashboardFeaturedShelf[]> {
  const body: ReorderDashboardFeaturedShelvesRequest = { ids }
  return readJson(await api('/api/v1/dashboard/featured-shelves/order', jsonRequest('PUT', body)), 'Failed to reorder the shelves')
}

export async function deleteFeaturedShelf(id: number): Promise<void> {
  const response = await api(`/api/v1/dashboard/featured-shelves/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Failed to delete the shelf')
}

export async function uploadFeaturedShelfImage(id: number, file: File): Promise<DashboardFeaturedShelf> {
  const form = new FormData()
  form.append('file', file)
  return readJson(await api(`/api/v1/dashboard/featured-shelves/${id}/image`, { method: 'POST', body: form }), 'Failed to upload the saint portrait')
}

export async function deleteFeaturedShelfImage(id: number): Promise<DashboardFeaturedShelf> {
  return readJson(await api(`/api/v1/dashboard/featured-shelves/${id}/image`, { method: 'DELETE' }), 'Failed to remove the saint portrait')
}

export async function addDashboardShelfBooks(shelfId: number, bookIds: number[]): Promise<AddDashboardShelfBooksResponse> {
  const body: AddDashboardShelfBooksRequest = { bookIds }
  return readJson(await api(`/api/v1/dashboard/featured-shelves/${shelfId}/books`, jsonRequest('POST', body)), 'Failed to add books to the shelf')
}

export async function removeDashboardShelfBook(shelfId: number, bookId: number): Promise<void> {
  const response = await api(`/api/v1/dashboard/featured-shelves/${shelfId}/books/${bookId}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Failed to remove the book from the shelf')
}

export async function saveDashboardDefaultLayout(layout: DashboardDefaultLayout): Promise<DashboardDefaultLayout> {
  return readJson(await api('/api/v1/dashboard/default-layout', jsonRequest('PUT', layout)), 'Failed to save the default dashboard')
}
