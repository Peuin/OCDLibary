import type { AchievementCatalogueResponse, AchievementItem } from '@bookorbit/types'
import { i18n } from '@/i18n'

// The server seeds achievement names and category labels in English only, so the catalogue
// carries translations keyed by the stable achievement key and falls back to the server text.
function translated(key: string, fallback: string): string {
  return i18n.global.te(key) || i18n.global.te(key, 'en') ? i18n.global.t(key) : fallback
}

export function localizeAchievementName(key: string, fallback: string): string {
  return translated(`achievements.items.${key}.name`, fallback)
}

export function localizeAchievement<T extends Pick<AchievementItem, 'key' | 'name' | 'description'>>(item: T): T {
  return {
    ...item,
    name: localizeAchievementName(item.key, item.name),
    description: translated(`achievements.items.${item.key}.description`, item.description),
  }
}

export function localizeAchievementCatalogue(catalogue: AchievementCatalogueResponse): AchievementCatalogueResponse {
  return {
    ...catalogue,
    categories: catalogue.categories.map((category) => ({
      ...category,
      label: translated(`achievements.categories.${category.key}`, category.label),
      achievements: category.achievements.map(localizeAchievement),
    })),
  }
}
