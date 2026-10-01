export type StatisticsChartId = "format-distribution" | "language-distribution" | "books-added-over-time" | "storage-by-format" | "publication-decade" | "top-authors" | "metadata-completeness" | "genre-distribution" | "metadata-score-distribution" | "library-metadata-completeness" | "format-share-over-time" | "page-count-distribution" | "reading-heatmap" | "reading-source-distribution" | "peak-reading-hours" | "favorite-reading-days" | "completion-timeline" | "goal-trajectory" | "progress-funnel" | "completion-latency" | "genre-reading-time" | "reading-pace" | "books-completed" | "reading-clock" | "reading-session-timeline" | "session-archetypes" | "genre-cooccurrence" | "metadata-freshness-gauge" | "library-integrity-gauge" | "acquisition-lag-scatter" | "largest-books" | "top-series" | "publication-year-timeline";
export type StatisticsGranularity = "monthly" | "yearly";
export type StatisticsDateRange = "last-year" | "last-5-years" | "all-time";
export interface ChartConfigEntry {
    id: StatisticsChartId;
    visible: boolean;
    order: number;
}
export interface StatisticsFilterConfig {
    libraryIds: number[];
    booksOverTimeGranularity: StatisticsGranularity;
    booksOverTimeRange: StatisticsDateRange;
}
export interface StatisticsSettings {
    charts: ChartConfigEntry[];
    filters: StatisticsFilterConfig;
}
export declare const DEFAULT_LIBRARY_CHART_ORDER: StatisticsChartId[];
export declare const DEFAULT_USER_CHART_ORDER: StatisticsChartId[];
export declare const DEFAULT_STATISTICS_CHART_ORDER: StatisticsChartId[];
export declare const DEFAULT_STATISTICS_FILTERS: StatisticsFilterConfig;
export declare function createDefaultStatisticsSettings(): StatisticsSettings;
export interface ChordNode {
    name: string;
}
export interface ChordLink {
    source: string;
    target: string;
    value: number;
}
export interface ChordDiagramData {
    nodes: ChordNode[];
    links: ChordLink[];
}
export interface StatisticsResult<T> {
    items: T[];
    unknownCount: number;
}
export interface FormatDistributionItem {
    format: string;
    count: number;
}
export interface LanguageDistributionItem {
    language: string;
    count: number;
}
export interface BooksAddedDataPoint {
    year: number;
    month: number;
    count: number;
}
export interface StorageByFormatItem {
    format: string;
    sizeBytes: number;
}
export interface PublicationDecadeItem {
    decade: number;
    count: number;
}
export interface PublicationYearPoint {
    year: number;
    count: number;
    topTitles: string[];
}
export interface TopAuthorItem {
    name: string;
    count: number;
}
export interface MetadataCompletenessItem {
    field: string;
    presentCount: number;
    totalCount: number;
}
export interface GenreDistributionItem {
    genre: string;
    count: number;
}
export interface MetadataScoreDistributionBin {
    minScore: number;
    maxScore: number;
    count: number;
}
export interface MetadataScoreDistribution {
    bins: MetadataScoreDistributionBin[];
    unknownCount: number;
    totalCount: number;
    percentile25: number | null;
    percentile50: number | null;
    percentile75: number | null;
    percentile90: number | null;
}
export interface LibraryMetadataCompletenessItem {
    libraryId: number;
    libraryName: string;
    field: string;
    presentCount: number;
    totalCount: number;
    percent: number;
}
export interface FormatShareOverTimeItem {
    year: number;
    month: number;
    format: string;
    count: number;
}
export interface PageCountDistributionItem {
    format: string;
    count: number;
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
}
export interface MetadataFreshnessGauge {
    totalBooks: number;
    neverFetchedCount: number;
    fresh30dCount: number;
    stale31To90dCount: number;
    stale91To180dCount: number;
    staleOver180dCount: number;
    freshnessScore: number;
}
export interface LibraryIntegrityGauge {
    totalBooks: number;
    presentCount: number;
    primaryFileCount: number;
    metadataCount: number;
    integrityScore: number;
}
export interface AcquisitionLagPoint {
    addedYear: number;
    lagYears: number;
    count: number;
}
export interface LargestBookItem {
    id: number;
    title: string;
    sizeBytes: number;
    format: string;
}
export interface TopSeriesItem {
    name: string;
    count: number;
}
export interface StatisticsSummary {
    totalBooks: number;
    totalAuthors: number;
    totalSeries: number;
    totalPublishers: number;
    totalStorageBytes: number;
    totalGenres: number;
    totalLanguages: number;
    publicationYearMin: number | null;
    publicationYearMax: number | null;
    booksAddedThisYear: number;
}
//# sourceMappingURL=statistics.d.ts.map