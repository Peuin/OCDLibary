"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERIES_INDEX_PATTERN = exports.SERIES_INDEX_MAX_LENGTH = void 0;
exports.isValidSeriesIndex = isValidSeriesIndex;
exports.parseSeriesIndex = parseSeriesIndex;
exports.isPositiveSeriesIndex = isPositiveSeriesIndex;
exports.compareSeriesIndices = compareSeriesIndices;
exports.formatSeriesIndex = formatSeriesIndex;
exports.SERIES_INDEX_MAX_LENGTH = 20;
exports.SERIES_INDEX_PATTERN = /^\d+(?:\.\d+)?$/;
function isValidSeriesIndex(value) {
    return value.length <= exports.SERIES_INDEX_MAX_LENGTH && exports.SERIES_INDEX_PATTERN.test(value);
}
function parseSeriesIndex(value) {
    const candidate = typeof value === "string" ? value.trim() : typeof value === "number" && Number.isFinite(value) ? String(value) : "";
    return isValidSeriesIndex(candidate) ? candidate : null;
}
function isPositiveSeriesIndex(value) {
    return /[1-9]/.test(value);
}
function normalizedIntegerSegment(value) {
    const normalized = value.replace(/^0+(?=\d)/, "");
    return normalized || "0";
}
function compareIntegerSegments(a, b) {
    const normalizedA = normalizedIntegerSegment(a);
    const normalizedB = normalizedIntegerSegment(b);
    if (normalizedA.length !== normalizedB.length)
        return normalizedA.length < normalizedB.length ? -1 : 1;
    if (normalizedA === normalizedB)
        return 0;
    return normalizedA < normalizedB ? -1 : 1;
}
function compareSeriesIndices(a, b) {
    const [aWhole, aFraction] = a.split(".");
    const [bWhole, bFraction] = b.split(".");
    const wholeComparison = compareIntegerSegments(aWhole, bWhole);
    if (wholeComparison !== 0)
        return wholeComparison;
    if (aFraction === undefined && bFraction !== undefined)
        return -1;
    if (aFraction !== undefined && bFraction === undefined)
        return 1;
    if (aFraction !== undefined && bFraction !== undefined) {
        const fractionComparison = compareIntegerSegments(aFraction, bFraction);
        if (fractionComparison !== 0)
            return fractionComparison;
    }
    if (a === b)
        return 0;
    return a < b ? -1 : 1;
}
function formatSeriesIndex(value) {
    const parsed = parseSeriesIndex(value);
    if (parsed == null)
        return null;
    const [whole, fraction] = parsed.split(".");
    const padded = whole.padStart(2, "0");
    return fraction === undefined ? padded : `${padded}.${fraction}`;
}
