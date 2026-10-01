import { MetadataProviderKey } from "./metadata-fetch";
export type MetadataField = "title" | "subtitle" | "description" | "cover" | "authors" | "publisher" | "publishedYear" | "language" | "pageCount" | "communityRating" | "seriesName" | "seriesIndex" | "genres" | "narrators" | "duration" | "abridged";
export declare const ALL_METADATA_FIELDS: MetadataField[];
export type MergeStrategy = "fillMissing" | "overwrite" | "overwriteIfProvided";
export type MetadataMergeStrategy = MergeStrategy | "mergeExisting";
export type GenreMergeMode = "firstProvider" | "merge";
export type ProviderIdFetchMode = "preferExisting" | "existingOnly";
export declare const MERGE_STRATEGIES: MergeStrategy[];
export declare const GENRE_MERGE_STRATEGIES: MetadataMergeStrategy[];
export declare const GENRE_MERGE_MODES: GenreMergeMode[];
export declare const PROVIDER_ID_FETCH_MODES: ProviderIdFetchMode[];
export declare const MAX_METADATA_GENRE_COUNT = 50;
export interface FieldPreference {
    enabled: boolean;
    providers: MetadataProviderKey[];
    mergeStrategy: MetadataMergeStrategy;
}
export type FieldPreferenceOverrides = Partial<Record<MetadataField, FieldPreference>>;
export interface MetadataFetchOptions {
    genres: {
        mode: GenreMergeMode;
        blocklist: string[];
        maxCount: number | null;
    };
    saveProviderIds: boolean;
    providerIdMode: ProviderIdFetchMode;
}
export interface MetadataFetchPreferences {
    fields: Record<MetadataField, FieldPreference>;
    options?: MetadataFetchOptions;
}
export interface LibraryMetadataPreferences {
    libraryId: number;
    overrides: FieldPreferenceOverrides | null;
    effective: MetadataFetchPreferences;
}
export interface GoogleProviderConfig {
    enabled: boolean;
    apiKey: string;
}
export interface HardcoverProviderConfig {
    enabled: boolean;
    apiKey: string;
}
export interface AmazonProviderConfig {
    enabled: boolean;
    domain: string;
    cookie: string;
}
export interface SimpleProviderConfig {
    enabled: boolean;
}
export type ITunesCoverResolution = "standard" | "high";
export declare const ITUNES_COVER_RESOLUTIONS: ITunesCoverResolution[];
export interface ITunesProviderConfig {
    enabled: boolean;
    coverResolution: ITunesCoverResolution;
}
export interface AudibleProviderConfig {
    enabled: boolean;
    domain: string;
}
export interface AudnexusProviderConfig {
    enabled: boolean;
}
export interface ComicVineProviderConfig {
    enabled: boolean;
    apiKey: string;
}
export interface KoboProviderConfig {
    enabled: boolean;
    country: string;
    language: string;
}
export interface AladinProviderConfig {
    enabled: boolean;
    ttbKey: string;
}
export interface ProviderConfigurations {
    google: GoogleProviderConfig;
    amazon: AmazonProviderConfig;
    goodreads: SimpleProviderConfig;
    hardcover: HardcoverProviderConfig;
    openLibrary: SimpleProviderConfig;
    itunes: ITunesProviderConfig;
    audible: AudibleProviderConfig;
    audnexus: AudnexusProviderConfig;
    librofm: SimpleProviderConfig;
    comicvine: ComicVineProviderConfig;
    ranobedb: SimpleProviderConfig;
    kobo: KoboProviderConfig;
    lubimyczytac: SimpleProviderConfig;
    aladin: AladinProviderConfig;
}
export interface ProviderStatus {
    key: MetadataProviderKey;
    label: string;
    configured: boolean;
    enabled: boolean;
    hint?: string;
}
export type ProviderConnectionTestStatus = "success" | "warning" | "fail";
export interface ProviderConnectionTestResult {
    key: MetadataProviderKey;
    ok: boolean;
    status: ProviderConnectionTestStatus;
    message: string;
}
//# sourceMappingURL=metadata-preferences.d.ts.map