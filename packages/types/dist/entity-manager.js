"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENTITY_CAPABILITIES = exports.ALL_ENTITY_TYPES = exports.INLINE_ENTITY_TYPES = exports.FIRST_CLASS_ENTITY_TYPES = void 0;
exports.FIRST_CLASS_ENTITY_TYPES = ["author", "genre", "tag", "narrator", "series"];
exports.INLINE_ENTITY_TYPES = ["publisher", "language"];
exports.ALL_ENTITY_TYPES = [...exports.FIRST_CLASS_ENTITY_TYPES, ...exports.INLINE_ENTITY_TYPES];
exports.ENTITY_CAPABILITIES = {
    author: { canSplit: true, hasSoftDelete: true, hasPhoto: true, hasSortName: true },
    genre: { canSplit: true, hasSoftDelete: true, hasPhoto: false, hasSortName: false },
    tag: { canSplit: true, hasSoftDelete: true, hasPhoto: false, hasSortName: false },
    narrator: { canSplit: true, hasSoftDelete: true, hasPhoto: false, hasSortName: true },
    publisher: { canSplit: false, hasSoftDelete: false, hasPhoto: false, hasSortName: false },
    language: { canSplit: false, hasSoftDelete: false, hasPhoto: false, hasSortName: false },
    series: { canSplit: false, hasSoftDelete: false, hasPhoto: false, hasSortName: false },
};
