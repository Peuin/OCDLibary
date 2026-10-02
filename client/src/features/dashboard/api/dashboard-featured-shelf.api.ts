import type {
  CreateDashboardFeaturedShelfRequest,
  DashboardDefaultLayout,
  DashboardFeaturedShelf,
  DashboardSharedConfig,
  UpdateDashboardFeaturedShelfRequest,
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

export async function fetchFeaturedShelves(): Promise<DashboardFeaturedShelf[]> {
  return readJson(await api('/api/v1/dashboard/featured-shelves'), 'Failed to load featured shelves')
}

export async function createFeaturedShelf(body: CreateDashboardFeaturedShelfRequest): Promise<DashboardFeaturedShelf> {
  return readJson(await api('/api/v1/dashboard/featured-shelves', jsonRequest('POST', body)), 'Failed to create the featured shelf')
}

export async function updateFeaturedShelf(id: number, body: UpdateDashboardFeaturedShelfRequest): Promise<DashboardFeaturedShelf> {
  return readJson(await api(`/api/v1/dashboard/featured-shelves/${id}`, jsonRequest('PATCH', body)), 'Failed to update the featured shelf')
}

export async function reorderFeaturedShelves(ids: number[]): Promise<DashboardFeaturedShelf[]> {
  return readJson(await api('/api/v1/dashboard/featured-shelves/order', jsonRequest('PUT', { ids })), 'Failed to reorder featured shelves')
}

export async function deleteFeaturedShelf(id: number): Promise<void> {
  const response = await api(`/api/v1/dashboard/featured-shelves/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Failed to delete the featured shelf')
}

export async function uploadFeaturedShelfImage(id: number, file: File): Promise<DashboardFeaturedShelf> {
  const form = new FormData()
  form.append('file', file)
  return readJson(await api(`/api/v1/dashboard/featured-shelves/${id}/image`, { method: 'POST', body: form }), 'Failed to upload the shelf image')
}

export async function deleteFeaturedShelfImage(id: number): Promise<DashboardFeaturedShelf> {
  return readJson(await api(`/api/v1/dashboard/featured-shelves/${id}/image`, { method: 'DELETE' }), 'Failed to remove the shelf image')
}

export async function saveDashboardDefaultLayout(layout: DashboardDefaultLayout): Promise<DashboardDefaultLayout> {
  return readJson(await api('/api/v1/dashboard/default-layout', jsonRequest('PUT', layout)), 'Failed to save the default dashboard')
}
