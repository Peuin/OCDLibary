export type MetadataScoreField = "title" | "subtitle" | "description" | "coverSource" | "genres" | "isbn13" | "publisher" | "publishedYear" | "language" | "isbn10" | "pageCount" | "rating" | "seriesName" | "seriesIndex" | "tags" | "authors" | "googleBooksId" | "goodreadsId" | "amazonId" | "hardcoverId" | "openLibraryId" | "itunesId" | "koboId" | "aladinId";
export type MetadataScoreGroup = "core" | "publishing" | "classification" | "enrichment" | "providers";
/**
 * How the scorer decides a field is present. The client shows this to explain a row; the server
 * keeps the matching behaviour in SCORE_RULES. The two must stay in step.
 */
export type MetadataScoreRule = "text" | "positive" | "count" | "cover" | "providerId" | "seriesIndex";
export interface MetadataScoreFieldMeta {
    group: MetadataScoreGroup;
    rule: MetadataScoreRule;
    defaultWeight: number;
}
export declare const METADATA_SCORE_FIELDS: Record<MetadataScoreField, MetadataScoreFieldMeta>;
/** Display order for the groups. Not alphabetical: it runs from most to least weight by default. */
export declare const METADATA_SCORE_GROUPS: readonly MetadataScoreGroup[];
export type MetadataScoreWeights = Record<MetadataScoreField, number>;
export declare const DEFAULT_METADATA_SCORE_WEIGHTS: MetadataScoreWeights;
/**
 * A weight at or below zero removes the field from the score entirely, denominator included, so a
 * book missing it is not marked down. Mirrors the guard in MetadataScoreScorer.compute.
 */
export declare function isMetadataScoreFieldScoring(weight: number | null | undefined): boolean;
/** Sum of every scoring weight. This is the denominator the server divides by. */
export declare function totalMetadataScoreWeight(weights: MetadataScoreWeights): number;
export type MetadataScoreRecalculationState = "idle" | "running" | "completed" | "failed";
export type MetadataScoreRecalculationTrigger = "manual" | "weights_update";
/**
 * Wire shape of GET /metadata-score/recalculate/status. Timestamps are ISO strings here; the
 * service holds them as Date instances before serialization.
 */
export interface MetadataScoreRecalculationStatus {
    state: MetadataScoreRecalculationState;
    trigger: MetadataScoreRecalculationTrigger | null;
    startedAt: string | null;
    endedAt: string | null;
    processed: number;
    succeeded: number;
    failed: number;
    error: string | null;
}
//# sourceMappingURL=metadata-score.d.ts.map