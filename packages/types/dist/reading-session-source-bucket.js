"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.READING_SESSION_SOURCE_BUCKET_LABELS = exports.READING_SESSION_SOURCE_BUCKETS = void 0;
exports.toReadingSessionSourceBucket = toReadingSessionSourceBucket;
exports.emptySourceBucketRecord = emptySourceBucketRecord;
exports.READING_SESSION_SOURCE_BUCKETS = ["bookorbit", "ios", "watchos", "android", "koreader", "kobo"];
exports.READING_SESSION_SOURCE_BUCKET_LABELS = {
    bookorbit: "BookOrbit",
    ios: "iOS app",
    watchos: "Apple Watch",
    android: "Android app",
    koreader: "KOReader",
    kobo: "Kobo",
};
// Web/manual and null/unknown history collapse into the general BookOrbit bucket.
// Native clients remain distinct so device attribution survives aggregation.
function toReadingSessionSourceBucket(source) {
    if (source === "ios")
        return "ios";
    if (source === "watchos")
        return "watchos";
    if (source === "android")
        return "android";
    if (source === "koreader")
        return "koreader";
    if (source === "kobo")
        return "kobo";
    return "bookorbit";
}
function emptySourceBucketRecord() {
    return { bookorbit: 0, ios: 0, watchos: 0, android: 0, koreader: 0, kobo: 0 };
}
