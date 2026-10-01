"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationLevel = exports.NOTIFICATION_CATEGORIES = exports.NOTIFICATION_TYPE_META = exports.NOTIFICATION_CATEGORY_IDS = exports.NotificationSeverity = exports.NotificationType = void 0;
exports.isProblemSeverity = isProblemSeverity;
exports.categorySupportsProblemsLevel = categorySupportsProblemsLevel;
exports.availableLevelsForCategory = availableLevelsForCategory;
exports.resolveNotificationLevel = resolveNotificationLevel;
exports.isNotificationAllowed = isNotificationAllowed;
exports.NotificationType = {
    ScanCompleted: "scan_completed",
    ScanFailed: "scan_failed",
    BooksUnavailable: "books_unavailable",
    BooksRestored: "books_restored",
    MetadataFetchCompleted: "metadata_fetch_completed",
    MetadataFetchFailed: "metadata_fetch_failed",
    BookDockFinalized: "book_dock_finalized",
    BookDockFinalizedWithErrors: "book_dock_finalized_with_errors",
    BookRequestSubmitted: "book_request_submitted",
    BookRequestApproved: "book_request_approved",
    BookRequestRejected: "book_request_rejected",
    BookRequestAvailable: "book_request_available",
    BookRequestNeedsReview: "book_request_needs_review",
    BookRequestNeedsRelease: "book_request_needs_release",
    BookRequestFailed: "book_request_failed",
    AuthorEnrichmentCompleted: "author_enrichment_completed",
    AuthorEnrichmentFailed: "author_enrichment_failed",
    EmailSent: "email_sent",
    EmailFailed: "email_failed",
    MigrationCompleted: "migration_completed",
    MigrationFailed: "migration_failed",
    FileWriteBackCompleted: "file_write_back_completed",
    FileWriteBackFailed: "file_write_back_failed",
    FileRenameCompleted: "file_rename_completed",
    FileRenameFailed: "file_rename_failed",
    BulkRenameCompleted: "bulk_rename_completed",
    BulkRenameFailed: "bulk_rename_failed",
    AchievementUnlocked: "achievement_unlocked",
    PodcastEpisodePublished: "podcast_episode_published",
    PodcastFeedUnhealthy: "podcast_feed_unhealthy",
    PodcastDownloadFailed: "podcast_download_failed",
};
/**
 * `warning` is a partial success: the operation delivered but something inside it did not.
 * It must reach a user who asked to hear about problems, which is why `problems` admits
 * both `warning` and `error`.
 */
exports.NotificationSeverity = {
    Success: "success",
    Warning: "warning",
    Error: "error",
};
exports.NOTIFICATION_CATEGORY_IDS = [
    "scanning",
    "metadata",
    "bookDock",
    "bookRequests",
    "authorEnrichment",
    "email",
    "migration",
    "fileWriteBack",
    "fileRename",
    "bulkRename",
    "achievements",
    "podcasts",
];
/**
 * Single source of truth for what a notification type *is*. Anything that needs to know a type's
 * category, colour, icon or severity reads it from here. Keeping a parallel copy on the client is
 * what let `bulk_rename_failed` render as a success for as long as it did.
 */
exports.NOTIFICATION_TYPE_META = {
    [exports.NotificationType.ScanCompleted]: { category: "scanning", severity: "success" },
    [exports.NotificationType.ScanFailed]: { category: "scanning", severity: "error" },
    [exports.NotificationType.BooksUnavailable]: { category: "scanning", severity: "warning" },
    [exports.NotificationType.BooksRestored]: { category: "scanning", severity: "success" },
    [exports.NotificationType.MetadataFetchCompleted]: { category: "metadata", severity: "success" },
    [exports.NotificationType.MetadataFetchFailed]: { category: "metadata", severity: "warning" },
    [exports.NotificationType.BookDockFinalized]: { category: "bookDock", severity: "success" },
    [exports.NotificationType.BookDockFinalizedWithErrors]: { category: "bookDock", severity: "warning" },
    [exports.NotificationType.BookRequestSubmitted]: { category: "bookRequests", severity: "success" },
    [exports.NotificationType.BookRequestApproved]: { category: "bookRequests", severity: "success" },
    [exports.NotificationType.BookRequestRejected]: { category: "bookRequests", severity: "warning" },
    [exports.NotificationType.BookRequestAvailable]: { category: "bookRequests", severity: "success" },
    [exports.NotificationType.BookRequestNeedsReview]: { category: "bookRequests", severity: "warning" },
    [exports.NotificationType.BookRequestNeedsRelease]: { category: "bookRequests", severity: "warning" },
    [exports.NotificationType.BookRequestFailed]: { category: "bookRequests", severity: "error" },
    [exports.NotificationType.AuthorEnrichmentCompleted]: { category: "authorEnrichment", severity: "success" },
    [exports.NotificationType.AuthorEnrichmentFailed]: { category: "authorEnrichment", severity: "warning" },
    [exports.NotificationType.EmailSent]: { category: "email", severity: "success" },
    [exports.NotificationType.EmailFailed]: { category: "email", severity: "error" },
    [exports.NotificationType.MigrationCompleted]: { category: "migration", severity: "success" },
    [exports.NotificationType.MigrationFailed]: { category: "migration", severity: "error" },
    [exports.NotificationType.FileWriteBackCompleted]: { category: "fileWriteBack", severity: "success" },
    [exports.NotificationType.FileWriteBackFailed]: { category: "fileWriteBack", severity: "error" },
    [exports.NotificationType.FileRenameCompleted]: { category: "fileRename", severity: "success" },
    [exports.NotificationType.FileRenameFailed]: { category: "fileRename", severity: "error" },
    [exports.NotificationType.BulkRenameCompleted]: { category: "bulkRename", severity: "success" },
    [exports.NotificationType.BulkRenameFailed]: { category: "bulkRename", severity: "warning" },
    [exports.NotificationType.AchievementUnlocked]: { category: "achievements", severity: "success" },
    [exports.NotificationType.PodcastEpisodePublished]: { category: "podcasts", severity: "success" },
    [exports.NotificationType.PodcastFeedUnhealthy]: { category: "podcasts", severity: "warning" },
    [exports.NotificationType.PodcastDownloadFailed]: { category: "podcasts", severity: "error" },
};
exports.NOTIFICATION_CATEGORIES = exports.NOTIFICATION_CATEGORY_IDS.reduce((acc, category) => {
    acc[category] = Object.keys(exports.NOTIFICATION_TYPE_META).filter((type) => exports.NOTIFICATION_TYPE_META[type].category === category);
    return acc;
}, {});
exports.NotificationLevel = {
    Off: "off",
    /** Warnings and errors only. */
    Problems: "problems",
    All: "all",
};
const PROBLEM_SEVERITIES = [exports.NotificationSeverity.Warning, exports.NotificationSeverity.Error];
function isProblemSeverity(severity) {
    return PROBLEM_SEVERITIES.includes(severity);
}
/**
 * Categories with no warning or error member cannot express "problems only"; there, the level
 * would silently mean the same as "off". Callers use this to render a two-state toggle instead of
 * offering a third option that does nothing.
 */
function categorySupportsProblemsLevel(category) {
    return exports.NOTIFICATION_CATEGORIES[category].some((type) => isProblemSeverity(exports.NOTIFICATION_TYPE_META[type].severity));
}
function availableLevelsForCategory(category) {
    return categorySupportsProblemsLevel(category)
        ? [exports.NotificationLevel.Off, exports.NotificationLevel.Problems, exports.NotificationLevel.All]
        : [exports.NotificationLevel.Off, exports.NotificationLevel.All];
}
function isNotificationLevel(value) {
    return value === exports.NotificationLevel.Off || value === exports.NotificationLevel.Problems || value === exports.NotificationLevel.All;
}
/**
 * Accepts the legacy boolean shape so stored preferences need no migration:
 * `false` meant "category off", anything else meant "send everything".
 */
function resolveNotificationLevel(raw) {
    if (raw === false)
        return exports.NotificationLevel.Off;
    if (raw === true || raw === undefined || raw === null)
        return exports.NotificationLevel.All;
    return isNotificationLevel(raw) ? raw : exports.NotificationLevel.All;
}
function isNotificationAllowed(level, severity) {
    if (level === exports.NotificationLevel.Off)
        return false;
    if (level === exports.NotificationLevel.All)
        return true;
    return isProblemSeverity(severity);
}
