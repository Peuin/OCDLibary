import type { BookQuery, SortSpec } from "./query";
export type JumpBucketKind = "letter" | "temporal" | "category";
export type TemporalJumpBucketUnit = "day" | "month" | "year";
export type TemporalJumpBucketGranularity = {
    unit: TemporalJumpBucketUnit;
    step: number;
};
/**
 * One jump target on the rail. `index` is the absolute 0-based row index of the
 * first book in this bucket under the listing's exact sort order, so a jump is
 * just scroll-to-index. Buckets are returned in display order (already reversed
 * for descending sorts).
 */
export type JumpBucket = {
    key: string;
    label: string;
    index: number;
    isUnknown?: boolean;
};
export type JumpBucketsResponse = {
    buckets: JumpBucket[];
    total: number;
    kind: JumpBucketKind;
    granularity: TemporalJumpBucketGranularity | null;
};
export type JumpBucketsQuery = BookQuery & {
    maxBuckets: number;
};
export type TemporalJumpBucketPrecision = "date" | "year";
export type JumpRailStrategy = {
    kind: "letter";
} | {
    kind: "temporal";
    precision: TemporalJumpBucketPrecision;
} | {
    kind: "category";
};
export declare function jumpRailStrategyForSort(sort: SortSpec[]): JumpRailStrategy | null;
/**
 * Single source of truth for rail eligibility, shared by the client (gate the
 * rail and bucket fetches) and the server (validate + pick bucket expression).
 * Only the primary sort field matters: secondary sorts reorder rows within
 * equal primary values and cannot move bucket boundaries. An empty sort means
 * title ascending, mirroring the server's default.
 */
export declare function jumpBucketKindForSort(sort: SortSpec[]): JumpBucketKind | null;
export declare function temporalJumpBucketPrecisionForSort(sort: SortSpec[]): TemporalJumpBucketPrecision | null;
//# sourceMappingURL=jump-buckets.d.ts.map