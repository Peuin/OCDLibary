import type { AchievementCatalogueResponse } from '@bookorbit/types'
import { api } from '@/lib/api'
import { localizeAchievementCatalogue } from '../utils/localizeAchievement'

export async function fetchAchievements(): Promise<AchievementCatalogueResponse> {
  const res = await api('/api/v1/achievements')
  if (!res.ok) throw new Error('Failed to fetch achievements')
  return localizeAchievementCatalogue((await res.json()) as AchievementCatalogueResponse)
}
