import { i18n } from '@/i18n'

export const APP_TITLE = 'OCD Library'

export function appTitle(): string {
  return i18n.global.t('common.appName') || APP_TITLE
}

export function formatPageTitle(leaf: string | null | undefined): string {
  const trimmed = (leaf ?? '').trim()
  const title = appTitle()
  if (!trimmed) return title
  return `${trimmed} · ${title}`
}
