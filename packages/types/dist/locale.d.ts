export declare const SUPPORTED_LOCALES: readonly ["en", "cs", "da", "de", "el", "es", "fi", "fr", "hu", "id", "it", "ja", "ko", "nl", "pl", "pt", "ro", "ru", "sk", "sl", "sv", "tr", "uk", "vi", "zh", "zh-Hant"];
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export declare const DEFAULT_LOCALE: Locale;
/** Native display names for each supported locale, shown in the language picker. */
export declare const LOCALE_LABELS: Record<Locale, string>;
export declare const LOCALE_DIRECTIONS: Record<Locale, "ltr" | "rtl">;
export interface LocalePreferences {
    locale: Locale;
}
export declare function isSupportedLocale(value: unknown): value is Locale;
//# sourceMappingURL=locale.d.ts.map