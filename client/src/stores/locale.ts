import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DEFAULT_LOCALE, INITIAL_LOCALE, SUPPORTED_LOCALES, isSupportedLocale, type Locale } from '@bookorbit/types'
import { storage } from '@/services/storage'
import { activateI18nLocale, loadLocaleMessages } from '@/i18n'

const STORAGE_KEY = 'locale'
export const LOCALE_DEFAULT_MARKER_KEY = 'localeDefault'

function canonicalizeLocale(value: string): string | null {
  try {
    return Intl.getCanonicalLocales(value)[0] ?? null
  } catch {
    return null
  }
}

export function matchSupportedLocale(candidates: readonly string[]): Locale | null {
  const supportedByCanonical = new Map<string, Locale>()
  const supportedByLanguageAndScript = new Map<string, Locale>()
  for (const locale of SUPPORTED_LOCALES) {
    const canonical = canonicalizeLocale(locale)
    if (!canonical) continue
    supportedByCanonical.set(canonical.toLowerCase(), locale)
    const maximized = new Intl.Locale(canonical).maximize()
    if (maximized.script) {
      supportedByLanguageAndScript.set(`${maximized.language.toLowerCase()}-${maximized.script.toLowerCase()}`, locale)
    }
  }

  for (const candidate of candidates) {
    const canonical = canonicalizeLocale(candidate)
    if (!canonical) continue
    const exact = supportedByCanonical.get(canonical.toLowerCase())
    if (exact) return exact
    const maximized = new Intl.Locale(canonical).maximize()
    const language = maximized.language.toLowerCase()
    if (maximized.script) {
      const scriptMatch = supportedByLanguageAndScript.get(`${language}-${maximized.script.toLowerCase()}`)
      if (scriptMatch) return scriptMatch
    }
    const baseLocale = supportedByCanonical.get(language)
    if (baseLocale) return baseLocale
  }

  return null
}

export function detectInitialLocale(): Locale {
  const stored = storage.get<string>(STORAGE_KEY, '')
  // English was written to storage on every first visit, so a stored English is not a real
  // choice. Move it to the initial locale once, then respect whatever is picked.
  if (storage.get<string>(LOCALE_DEFAULT_MARKER_KEY, '') !== INITIAL_LOCALE) {
    storage.set(LOCALE_DEFAULT_MARKER_KEY, INITIAL_LOCALE)
    if (!stored || stored === DEFAULT_LOCALE) return INITIAL_LOCALE
  }
  if (isSupportedLocale(stored)) return stored

  return INITIAL_LOCALE
}

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref<Locale>(detectInitialLocale())
  let activationId = 0

  async function setLocale(next: Locale): Promise<void> {
    const currentActivationId = ++activationId
    await loadLocaleMessages(next)
    if (currentActivationId !== activationId) return
    activateI18nLocale(next)
    locale.value = next
    storage.set(STORAGE_KEY, next)
  }

  return { locale, setLocale }
})
