"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOK_DUPLICATE_SORT_ORDERS = exports.BOOK_DUPLICATE_GROUP_SORTS = exports.BOOK_DUPLICATE_SCAN_STATUSES = exports.BOOK_DUPLICATE_MATCH_REASONS = void 0;
exports.BOOK_DUPLICATE_MATCH_REASONS = ["file_hash", "isbn", "exact_metadata", "fuzzy_metadata"];
exports.BOOK_DUPLICATE_SCAN_STATUSES = ["queued", "running", "completed", "failed"];
exports.BOOK_DUPLICATE_GROUP_SORTS = ["reclaimable", "copies", "confidence", "title"];
exports.BOOK_DUPLICATE_SORT_ORDERS = ["asc", "desc"];
