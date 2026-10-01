import type { HighlightOfTheDayWidgetData, ReadingGoalWidgetData, ReadingStreakWidgetData } from "./dashboard";
import type { SeriesIndex } from "./series-index";
export interface KoreaderCredentials {
    username: string;
    syncEnabled: boolean;
    createdAt: string;
}
export interface KoreaderDeviceInfo {
    device: string;
    deviceId: string;
    lastSyncAt: string;
    lastBookTitle: string | null;
    /** Set when the device has been retired: its data is kept, but it is no longer treated as active. */
    retiredAt: string | null;
    fileNamingPattern?: string | null;
    seriesFileNamingPattern?: string | null;
    standaloneFileNamingPattern?: string | null;
}
export interface KoreaderBookProgress {
    device: string;
    deviceId: string;
    percentage: number;
    chapterIndex: number | null;
    chapterTitle: string | null;
    updatedAt: string;
}
export interface KoreaderDeviceSweepInfo {
    deviceId: string;
    deviceModel: string;
    pluginVersion: string | null;
    latestPluginVersion: string | null;
    updateAvailable: boolean | null;
    /**
     * The device runs a plugin too old to install its own updates, so the server
     * withholds the update offer and the user must install the zip by hand.
     */
    requiresManualUpdate: boolean;
    lastSweepAt: string;
    lastSweepBooksMatched: number;
    lastSweepPageStats: number;
    lastSweepAnnotations: number;
    retiredAt: string | null;
    fileNamingPattern?: string | null;
    seriesFileNamingPattern?: string | null;
    standaloneFileNamingPattern?: string | null;
}
export interface KoreaderPluginTotals {
    matchedBooks: number;
    trashedAnnotations: number;
    pendingDeletes: number;
    failedPositions: number;
    pageStatEvents: number;
    annotations: number;
    unmatchedBooks: number;
}
export interface KoreaderSyncStatus {
    credentials: KoreaderCredentials | null;
    devices: KoreaderDeviceInfo[];
    totalSyncedBooks: number;
    lastSyncAt: string | null;
    latestPluginVersion: string | null;
    pluginUpdateAvailable: boolean;
    sweeps: KoreaderDeviceSweepInfo[];
    pluginTotals: KoreaderPluginTotals;
}
export interface KoreaderBookSyncInfo {
    bookId: number;
    bookFileId: number;
    canonicalPercentage: number;
    canonicalChapterIndex: number | null;
    canonicalChapterTitle: string | null;
    canonicalSource: "koreader" | "web_reader";
    canonicalUpdatedAt: string;
    devices: KoreaderBookProgress[];
    fileModifiedSinceLastSync: boolean;
    /**
     * Devices sitting on a position the user reset away from. Their pushes are recorded but do
     * not move the book until the device takes the reset, so this is the state behind a device
     * and a book that visibly disagree.
     */
    heldByReset: KoreaderResetHeldDevice[];
}
export interface KoreaderResetHeldDevice {
    device: string;
    deviceId: string;
    percentage: number;
    updatedAt: string;
}
export interface KoreaderUnmatchedBook {
    hash: string;
    title: string | null;
    authors: string | null;
    lastOpen: number | null;
    firstSeenAt: string;
    lastSeenAt: string;
}
export interface KoreaderManualHashLink {
    hash: string;
    bookId: number;
    bookFileId: number;
    bookTitle: string | null;
    bookAuthors: string[];
    koreaderTitle: string | null;
    koreaderAuthors: string | null;
    koreaderLastOpen: number | null;
    createdAt: string;
    updatedAt: string;
}
export interface LinkKoreaderUnmatchedBookPayload {
    bookId: number;
}
export interface LinkKoreaderUnmatchedBookResult {
    hash: string;
    bookId: number;
    bookFileId: number;
}
export interface DismissKoreaderUnmatchedBookResult {
    hash: string;
}
export interface DismissAllKoreaderUnmatchedBooksResult {
    count: number;
}
export interface UpdateKoreaderManualHashLinkPayload {
    bookId: number;
}
export interface UnlinkKoreaderManualHashLinkResult {
    hash: string;
}
export interface CreateKoreaderCredentialsPayload {
    username: string;
    password: string;
}
export interface UpdateKoreaderCredentialsPayload {
    username?: string;
    password?: string;
    syncEnabled?: boolean;
}
export interface TestKoreaderConnectionResult {
    success: boolean;
    username: string;
    serverUrl: string;
}
export type KoreaderCatalogSection = "libraries" | "collections" | "smart-scopes" | "authors" | "series" | "search" | "recent" | "all-books" | "continue-reading";
export type KoreaderCatalogSort = "title" | "author" | "recently_added" | "recently_updated" | "recently_read" | "series";
export type KoreaderCatalogSortOrder = "asc" | "desc";
export type KoreaderCatalogReadStatusFilter = "unread" | "reading" | "finished";
export type KoreaderCatalogSettableReadStatus = "unread" | "want_to_read" | "reading" | "on_hold" | "read" | "abandoned";
export interface KoreaderCatalogSeriesSummary {
    total: number;
    finished: number;
}
export interface KoreaderCatalogEntry {
    id: string;
    title: string;
    section: KoreaderCatalogSection;
    subtitle?: string | null;
    count?: number;
    icon?: string | null;
    seriesId?: number;
    href?: string;
    booksHref?: string;
}
export interface KoreaderCatalogFile {
    id: number;
    format: string;
    role: string;
    downloadVariant: "original" | "audioless_epub";
    sizeBytes: number | null;
    durationSeconds: number | null;
    downloadUrl: string;
    devicePath: string;
}
export interface KoreaderCatalogProgress {
    fileId: number;
    percentage: number;
    koreaderProgress: string | null;
    updatedAt: string;
}
export interface KoreaderCatalogBookListItem {
    id: number;
    title: string;
    authors: string[];
    seriesId: number | null;
    seriesName: string | null;
    seriesIndex: SeriesIndex | null;
    progressPercentage: number | null;
    /** When reading progress was last recorded, so the plugin can show recency. */
    lastReadAt: string | null;
    readStatus: string | null;
    formats: string[];
    hasCover: boolean;
    thumbnailUrl: string | null;
    detailUrl: string;
    addedAt: string;
    updatedAt: string;
}
export type KoreaderCatalogRelatedSectionId = "series" | "author" | "similar";
export interface KoreaderCatalogRelatedBook {
    id: number;
    title: string | null;
    authors: string[];
    seriesIndex: SeriesIndex | null;
    hasCover: boolean;
    thumbnailUrl: string | null;
    detailUrl: string;
    updatedAt: string | null;
    isAudiobook?: boolean;
    isComic?: boolean;
}
export interface KoreaderCatalogRelatedSection {
    id: KoreaderCatalogRelatedSectionId;
    title: string;
    books: KoreaderCatalogRelatedBook[];
}
export interface KoreaderCatalogBookDetail extends KoreaderCatalogBookListItem {
    subtitle: string | null;
    description: string | null;
    publisher: string | null;
    publishedDate: string | null;
    publishedYear: number | null;
    language: string | null;
    isbn10: string | null;
    isbn13: string | null;
    libraryId: number;
    libraryName: string;
    rating: number | null;
    pageCount: number | null;
    collections: {
        id: number;
        name: string;
    }[];
    genres: string[];
    tags: string[];
    progress: KoreaderCatalogProgress | null;
    files: KoreaderCatalogFile[];
    relatedSections: KoreaderCatalogRelatedSection[];
}
export interface KoreaderCatalogPage<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
    hasNext: boolean;
    hasPrevious: boolean;
    nextUrl: string | null;
    previousUrl: string | null;
    seriesSummary?: KoreaderCatalogSeriesSummary | null;
}
export interface KoreaderCatalogSectionResponse {
    section: KoreaderCatalogSection;
    items: KoreaderCatalogEntry[];
    page?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
    nextUrl?: string | null;
    previousUrl?: string | null;
    query?: string | null;
}
export declare const KOREADER_DASHBOARD_SECTION_TYPE: {
    readonly RANDOM: "random";
    readonly RECENTLY_ADDED: "recently-added";
    readonly WANT_TO_READ: "want-to-read";
    readonly UP_NEXT_IN_SERIES: "up-next-in-series";
    readonly SMART_SCOPE: "smart-scope";
};
export type KoreaderDashboardSectionType = (typeof KOREADER_DASHBOARD_SECTION_TYPE)[keyof typeof KOREADER_DASHBOARD_SECTION_TYPE];
export declare const KOREADER_DASHBOARD_SECTION_TYPES: ReadonlyArray<KoreaderDashboardSectionType>;
export interface KoreaderDashboardSectionConfig {
    type: KoreaderDashboardSectionType;
    smartScopeId?: number;
}
export interface KoreaderCatalogDashboardSection {
    type: KoreaderDashboardSectionType;
    smartScopeId: number | null;
    books: KoreaderCatalogBookListItem[];
}
export interface KoreaderCatalogBrowseCounts {
    inProgress: number;
    libraries: number;
    authors: number;
    series: number;
    collections: number;
    smartScopes: number;
}
export interface KoreaderCatalogDashboardResponse {
    generatedAt: string;
    username: string;
    displayName: string;
    totalBooks: number;
    browseCounts?: KoreaderCatalogBrowseCounts;
    sections: KoreaderCatalogEntry[];
    continueReading: KoreaderCatalogBookListItem[];
    discover: KoreaderCatalogBookListItem[];
    section?: KoreaderCatalogDashboardSection;
    readingGoal: ReadingGoalWidgetData;
    readingStreak: ReadingStreakWidgetData;
    highlightOfTheDay: HighlightOfTheDayWidgetData | null;
}
export interface KoreaderCatalogDiscoverResponse {
    discover: KoreaderCatalogBookListItem[];
}
export interface KoreaderCatalogDashboardSectionResponse {
    section: KoreaderCatalogDashboardSection;
}
export interface KoreaderCatalogManifestFile {
    id: number;
    format: string;
    downloadVariant: "original" | "audioless_epub";
    sizeBytes: number | null;
    contentVersion: string;
    fileHash: string | null;
    downloadUrl: string;
    devicePath: string;
}
export interface KoreaderCatalogManifestBook {
    id: number;
    title: string;
    authors: string[];
    seriesName: string | null;
    seriesIndex: SeriesIndex | null;
    formats: string[];
    files: KoreaderCatalogManifestFile[];
}
export interface KoreaderCatalogManifestPage {
    items: KoreaderCatalogManifestBook[];
    hasNext: boolean;
    nextCursor: string | null;
    manifestVersion: string;
    restartRequired: boolean;
}
export type KoreaderPluginCapability = "catalogBulkManifest" | "catalogDashboardSections" | "bookmarkSync";
export interface KoreaderPluginVersionInfo {
    pluginVersion: string;
    serverVersion: string;
    capabilities: KoreaderPluginCapability[];
}
export interface KoreaderCatalogReadStatusResult {
    readStatus: KoreaderCatalogSettableReadStatus;
}
export interface KoreaderCatalogRatingResult {
    rating: number | null;
}
//# sourceMappingURL=koreader.d.ts.map