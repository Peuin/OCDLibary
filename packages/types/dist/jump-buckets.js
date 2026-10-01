"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jumpRailStrategyForSort = jumpRailStrategyForSort;
exports.jumpBucketKindForSort = jumpBucketKindForSort;
exports.temporalJumpBucketPrecisionForSort = temporalJumpBucketPrecisionForSort;
const query_1 = require("./query");
const STRATEGY_BY_PRIMARY_SORT_FIELD = {
    title: { kind: "letter" },
    author: { kind: "letter" },
    series: { kind: "letter" },
    publisher: { kind: "letter" },
    addedAt: { kind: "temporal", precision: "date" },
    updatedAt: { kind: "temporal", precision: "date" },
    publishedDate: { kind: "temporal", precision: "year" },
    publishedYear: { kind: "temporal", precision: "year" },
    lastReadAt: { kind: "temporal", precision: "date" },
    startedAt: { kind: "temporal", precision: "date" },
    finishedAt: { kind: "temporal", precision: "date" },
    language: { kind: "category" },
    format: { kind: "category" },
    readStatus: { kind: "category" },
};
function jumpRailStrategyForSort(sort) {
    const primary = sort[0] ?? { field: "title", dir: "asc" };
    // Custom metadata fields carry no bucketing semantics, so the rail is hidden for them.
    if ((0, query_1.isCustomSortField)(primary.field))
        return null;
    return STRATEGY_BY_PRIMARY_SORT_FIELD[primary.field] ?? null;
}
/**
 * Single source of truth for rail eligibility, shared by the client (gate the
 * rail and bucket fetches) and the server (validate + pick bucket expression).
 * Only the primary sort field matters: secondary sorts reorder rows within
 * equal primary values and cannot move bucket boundaries. An empty sort means
 * title ascending, mirroring the server's default.
 */
function jumpBucketKindForSort(sort) {
    return jumpRailStrategyForSort(sort)?.kind ?? null;
}
function temporalJumpBucketPrecisionForSort(sort) {
    const strategy = jumpRailStrategyForSort(sort);
    return strategy?.kind === "temporal" ? strategy.precision : null;
}
