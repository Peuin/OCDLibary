"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ITUNES_COVER_RESOLUTIONS = exports.MAX_METADATA_GENRE_COUNT = exports.PROVIDER_ID_FETCH_MODES = exports.GENRE_MERGE_MODES = exports.GENRE_MERGE_STRATEGIES = exports.MERGE_STRATEGIES = exports.ALL_METADATA_FIELDS = void 0;
exports.ALL_METADATA_FIELDS = [
    "title",
    "subtitle",
    "description",
    "cover",
    "authors",
    "publisher",
    "publishedYear",
    "language",
    "pageCount",
    "communityRating",
    "seriesName",
    "seriesIndex",
    "genres",
    "narrators",
    "duration",
    "abridged",
];
exports.MERGE_STRATEGIES = ["fillMissing", "overwrite", "overwriteIfProvided"];
exports.GENRE_MERGE_STRATEGIES = ["fillMissing", "mergeExisting", "overwriteIfProvided", "overwrite"];
exports.GENRE_MERGE_MODES = ["firstProvider", "merge"];
exports.PROVIDER_ID_FETCH_MODES = ["preferExisting", "existingOnly"];
exports.MAX_METADATA_GENRE_COUNT = 50;
exports.ITUNES_COVER_RESOLUTIONS = ["standard", "high"];
