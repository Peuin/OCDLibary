"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MEDIA_TYPE = exports.MEDIA_TYPES = void 0;
exports.isMediaType = isMediaType;
exports.normalizeMediaType = normalizeMediaType;
/**
 * Which medium a user-owned container holds. Books and podcasts never share rows: their
 * underlying tables are disjoint, so scopes and collections carry this discriminator and
 * each one belongs to exactly one medium.
 */
exports.MEDIA_TYPES = ["books", "podcasts"];
exports.DEFAULT_MEDIA_TYPE = "books";
function isMediaType(value) {
    return exports.MEDIA_TYPES.includes(value);
}
function normalizeMediaType(value) {
    return isMediaType(value) ? value : exports.DEFAULT_MEDIA_TYPE;
}
