"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPTY_CONTENT_FILTER_RULES = void 0;
exports.isContentFilterEmpty = isContentFilterEmpty;
exports.EMPTY_CONTENT_FILTER_RULES = {
    includeTagIds: [],
    excludeTagIds: [],
    includeGenreIds: [],
    excludeGenreIds: [],
};
function isContentFilterEmpty(filters) {
    return (filters.includeTagIds.length === 0 &&
        filters.excludeTagIds.length === 0 &&
        filters.includeGenreIds.length === 0 &&
        filters.excludeGenreIds.length === 0);
}
