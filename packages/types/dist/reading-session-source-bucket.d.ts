import type { ReadingSessionSource } from "./reading-session";
export declare const READING_SESSION_SOURCE_BUCKETS: readonly ["bookorbit", "ios", "watchos", "android", "koreader", "kobo"];
export type ReadingSessionSourceBucket = (typeof READING_SESSION_SOURCE_BUCKETS)[number];
export declare const READING_SESSION_SOURCE_BUCKET_LABELS: Record<ReadingSessionSourceBucket, string>;
export declare function toReadingSessionSourceBucket(source: ReadingSessionSource | null | undefined): ReadingSessionSourceBucket;
export declare function emptySourceBucketRecord(): Record<ReadingSessionSourceBucket, number>;
//# sourceMappingURL=reading-session-source-bucket.d.ts.map