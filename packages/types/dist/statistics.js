"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_STATISTICS_FILTERS = exports.DEFAULT_STATISTICS_CHART_ORDER = exports.DEFAULT_USER_CHART_ORDER = exports.DEFAULT_LIBRARY_CHART_ORDER = void 0;
exports.createDefaultStatisticsSettings = createDefaultStatisticsSettings;
exports.DEFAULT_LIBRARY_CHART_ORDER = [
    "library-integrity-gauge",
    "format-distribution",
    "metadata-score-distribution",
    "metadata-freshness-gauge",
    "largest-books",
    "genre-distribution",
    "format-share-over-time",
    "top-authors",
    "metadata-completeness",
    "acquisition-lag-scatter",
    "library-metadata-completeness",
    "storage-by-format",
    "language-distribution",
    "page-count-distribution",
    "publication-decade",
    "genre-cooccurrence",
    "top-series",
    "books-added-over-time",
    "publication-year-timeline",
];
exports.DEFAULT_USER_CHART_ORDER = [
    "reading-heatmap",
    "peak-reading-hours",
    "favorite-reading-days",
    "completion-timeline",
    "goal-trajectory",
    "progress-funnel",
    "completion-latency",
    "genre-reading-time",
    "reading-pace",
    "books-completed",
    "reading-clock",
    "reading-session-timeline",
    "session-archetypes",
    "reading-source-distribution",
];
exports.DEFAULT_STATISTICS_CHART_ORDER = [...exports.DEFAULT_LIBRARY_CHART_ORDER, ...exports.DEFAULT_USER_CHART_ORDER];
exports.DEFAULT_STATISTICS_FILTERS = {
    libraryIds: [],
    booksOverTimeRange: "last-5-years",
    booksOverTimeGranularity: "monthly",
};
function createDefaultStatisticsSettings() {
    return {
        charts: exports.DEFAULT_STATISTICS_CHART_ORDER.map((id, order) => ({ id, order, visible: true })),
        filters: {
            libraryIds: [...exports.DEFAULT_STATISTICS_FILTERS.libraryIds],
            booksOverTimeRange: exports.DEFAULT_STATISTICS_FILTERS.booksOverTimeRange,
            booksOverTimeGranularity: exports.DEFAULT_STATISTICS_FILTERS.booksOverTimeGranularity,
        },
    };
}
