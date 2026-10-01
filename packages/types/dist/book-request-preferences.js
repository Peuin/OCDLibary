"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RETIRED_BOOK_REQUEST_PREFERENCE_FIELDS = exports.DEFAULT_BOOK_REQUEST_PREFERENCES = void 0;
exports.DEFAULT_BOOK_REQUEST_PREFERENCES = {
    defaultLanguage: null,
};
/**
 * Fields this category used to hold: first one destination for every medium, then one per medium.
 * Read only to be discarded, so a row written by either older build still parses and keeps its
 * language instead of failing strict validation and reverting to the defaults.
 */
exports.RETIRED_BOOK_REQUEST_PREFERENCE_FIELDS = ["defaultLibraryId", "defaultFolderId", "destinations"];
