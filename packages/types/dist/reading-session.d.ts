import type { ReadingSessionSourceBucket } from "./reading-session-source-bucket";
export declare const READING_SESSION_SOURCES: readonly ["web", "ios", "watchos", "android", "koreader", "manual", "kobo"];
export type ReadingSessionSource = (typeof READING_SESSION_SOURCES)[number];
export declare const CLIENT_READING_SESSION_SOURCES: readonly ["ios", "watchos", "android"];
export type ClientReadingSessionSource = (typeof CLIENT_READING_SESSION_SOURCES)[number];
export interface BookReadingSession {
    id: number;
    bookFileId: number | null;
    startedAt: string;
    endedAt: string;
    durationSeconds: number;
    progressDelta: number | null;
    endProgress: number | null;
    format: string | null;
    source: ReadingSessionSource | null;
    attemptId: number | null;
}
export interface BookReadingSourceSlice {
    bucket: ReadingSessionSourceBucket;
    totalSeconds: number;
    totalSessions: number;
}
export interface BookReadingSessionStats {
    totalSessions: number;
    totalSeconds: number;
    avgDurationSeconds: number;
    firstSessionAt: string | null;
    lastSessionAt: string | null;
    dailySummary: {
        day: string;
        totalMinutes: number;
    }[];
    paceProgressDelta: number;
    paceDurationSeconds: number;
    progressSummary: {
        day: string;
        endProgress: number;
    }[];
    latestEndProgress: number | null;
    bySource: BookReadingSourceSlice[];
    longestSessionSeconds: number;
    longestSessionAt: string | null;
    backtrackCount: number;
}
export interface BookReadingSessionListResponse {
    items: BookReadingSession[];
    total: number;
    page: number;
    pageSize: number;
    stats: BookReadingSessionStats;
}
//# sourceMappingURL=reading-session.d.ts.map