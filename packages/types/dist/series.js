"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERIES_GAP_PREVIEW_LIMIT = exports.SERIES_VOLUME_SLOT_LIMIT = void 0;
/**
 * Upper bound on the ladder a list row carries. A longer series still reports its true counts;
 * only the per-slot detail is cut, flagged by `volumesTruncated`.
 */
exports.SERIES_VOLUME_SLOT_LIMIT = 60;
/** Missing numbers named in a list row before the rest collapse into `gapCount`. */
exports.SERIES_GAP_PREVIEW_LIMIT = 8;
