"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_METADATA_SCORE_WEIGHTS = exports.METADATA_SCORE_GROUPS = exports.METADATA_SCORE_FIELDS = void 0;
exports.isMetadataScoreFieldScoring = isMetadataScoreFieldScoring;
exports.totalMetadataScoreWeight = totalMetadataScoreWeight;
exports.METADATA_SCORE_FIELDS = {
    title: { group: "core", rule: "text", defaultWeight: 10 },
    authors: { group: "core", rule: "count", defaultWeight: 10 },
    coverSource: { group: "core", rule: "cover", defaultWeight: 10 },
    description: { group: "core", rule: "text", defaultWeight: 8 },
    genres: { group: "core", rule: "count", defaultWeight: 6 },
    subtitle: { group: "core", rule: "text", defaultWeight: 0 },
    publisher: { group: "publishing", rule: "text", defaultWeight: 4 },
    publishedYear: { group: "publishing", rule: "positive", defaultWeight: 4 },
    language: { group: "publishing", rule: "text", defaultWeight: 4 },
    pageCount: { group: "publishing", rule: "positive", defaultWeight: 2 },
    isbn13: { group: "classification", rule: "text", defaultWeight: 7 },
    isbn10: { group: "classification", rule: "text", defaultWeight: 2 },
    seriesName: { group: "classification", rule: "text", defaultWeight: 0 },
    seriesIndex: { group: "classification", rule: "seriesIndex", defaultWeight: 0 },
    tags: { group: "enrichment", rule: "count", defaultWeight: 2 },
    rating: { group: "enrichment", rule: "positive", defaultWeight: 1 },
    googleBooksId: { group: "providers", rule: "providerId", defaultWeight: 1 },
    goodreadsId: { group: "providers", rule: "providerId", defaultWeight: 1 },
    amazonId: { group: "providers", rule: "providerId", defaultWeight: 1 },
    hardcoverId: { group: "providers", rule: "providerId", defaultWeight: 1 },
    openLibraryId: { group: "providers", rule: "providerId", defaultWeight: 1 },
    itunesId: { group: "providers", rule: "providerId", defaultWeight: 1 },
    koboId: { group: "providers", rule: "providerId", defaultWeight: 1 },
    aladinId: { group: "providers", rule: "providerId", defaultWeight: 1 },
};
/** Display order for the groups. Not alphabetical: it runs from most to least weight by default. */
exports.METADATA_SCORE_GROUPS = [
    "core",
    "publishing",
    "classification",
    "enrichment",
    "providers",
];
exports.DEFAULT_METADATA_SCORE_WEIGHTS = Object.fromEntries(Object.entries(exports.METADATA_SCORE_FIELDS).map(([field, meta]) => [field, meta.defaultWeight]));
/**
 * A weight at or below zero removes the field from the score entirely, denominator included, so a
 * book missing it is not marked down. Mirrors the guard in MetadataScoreScorer.compute.
 */
function isMetadataScoreFieldScoring(weight) {
    return typeof weight === "number" && Number.isFinite(weight) && weight > 0;
}
/** Sum of every scoring weight. This is the denominator the server divides by. */
function totalMetadataScoreWeight(weights) {
    return Object.values(weights).reduce((sum, weight) => (isMetadataScoreFieldScoring(weight) ? sum + weight : sum), 0);
}
