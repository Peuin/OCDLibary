export declare const SERIES_INDEX_MAX_LENGTH = 20;
export declare const SERIES_INDEX_PATTERN: RegExp;
export type SeriesIndex = string;
export declare function isValidSeriesIndex(value: string): value is SeriesIndex;
export declare function parseSeriesIndex(value: unknown): SeriesIndex | null;
export declare function isPositiveSeriesIndex(value: SeriesIndex): boolean;
export declare function compareSeriesIndices(a: SeriesIndex, b: SeriesIndex): number;
export declare function formatSeriesIndex(value: SeriesIndex | null): string | null;
//# sourceMappingURL=series-index.d.ts.map