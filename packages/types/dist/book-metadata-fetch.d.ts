import type { MetadataField } from "./metadata-preferences";
export interface BookMetadataFetchScoreCondition {
    enabled: boolean;
    threshold: number;
}
export interface BookMetadataFetchMissingFieldsCondition {
    enabled: boolean;
    fields: MetadataField[];
}
export interface BookMetadataFetchNeverFetchedCondition {
    enabled: boolean;
}
export interface BookMetadataFetchConditions {
    scoreThreshold: BookMetadataFetchScoreCondition;
    missingFields: BookMetadataFetchMissingFieldsCondition;
    neverFetched: BookMetadataFetchNeverFetchedCondition;
}
export interface BookMetadataFetchConfig {
    enabled: boolean;
    triggerOnImport: boolean;
    conditions: BookMetadataFetchConditions;
}
export interface BookMetadataFetchConditionsOverride {
    scoreThreshold?: Partial<BookMetadataFetchScoreCondition>;
    missingFields?: Partial<BookMetadataFetchMissingFieldsCondition>;
    neverFetched?: Partial<BookMetadataFetchNeverFetchedCondition>;
}
export type BookMetadataFetchConfigOverride = (Partial<Omit<BookMetadataFetchConfig, "conditions">> & {
    conditions?: BookMetadataFetchConditionsOverride;
}) | null;
export type BookMetadataFetchQueueStatus = "queued" | "processing" | "failed";
export type BookMetadataFetchReason = "event_import" | "manual_trigger" | "manual_retry";
export interface BookMetadataFetchStatus {
    queued: number;
    processing: number;
    failed: number;
    latestFailureAt: string | null;
    paused: boolean;
}
export interface BookMetadataFetchStatusEvent extends BookMetadataFetchStatus {
    sessionTotal: number;
    sessionDone: number;
    currentItemName: string | null;
}
export interface BookMetadataFetchLibraryConfig extends BookMetadataFetchConfig {
    override: BookMetadataFetchConfigOverride;
    lastRunAt: string | null;
    lastQueuedCount: number | null;
}
export interface BookMetadataFetchFailedItem {
    bookId: number;
    title: string | null;
    libraryName: string | null;
    error: string | null;
    httpStatus: number | null;
    failedAt: string;
}
export interface BookMetadataFetchFailedPage {
    items: BookMetadataFetchFailedItem[];
    total: number;
    page: number;
    limit: number;
}
//# sourceMappingURL=book-metadata-fetch.d.ts.map