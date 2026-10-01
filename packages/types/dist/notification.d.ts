export declare const NotificationType: {
    readonly ScanCompleted: "scan_completed";
    readonly ScanFailed: "scan_failed";
    readonly BooksUnavailable: "books_unavailable";
    readonly BooksRestored: "books_restored";
    readonly MetadataFetchCompleted: "metadata_fetch_completed";
    readonly MetadataFetchFailed: "metadata_fetch_failed";
    readonly BookDockFinalized: "book_dock_finalized";
    readonly BookDockFinalizedWithErrors: "book_dock_finalized_with_errors";
    readonly BookRequestSubmitted: "book_request_submitted";
    readonly BookRequestApproved: "book_request_approved";
    readonly BookRequestRejected: "book_request_rejected";
    readonly BookRequestAvailable: "book_request_available";
    readonly BookRequestNeedsReview: "book_request_needs_review";
    readonly BookRequestNeedsRelease: "book_request_needs_release";
    readonly BookRequestFailed: "book_request_failed";
    readonly AuthorEnrichmentCompleted: "author_enrichment_completed";
    readonly AuthorEnrichmentFailed: "author_enrichment_failed";
    readonly EmailSent: "email_sent";
    readonly EmailFailed: "email_failed";
    readonly MigrationCompleted: "migration_completed";
    readonly MigrationFailed: "migration_failed";
    readonly FileWriteBackCompleted: "file_write_back_completed";
    readonly FileWriteBackFailed: "file_write_back_failed";
    readonly FileRenameCompleted: "file_rename_completed";
    readonly FileRenameFailed: "file_rename_failed";
    readonly BulkRenameCompleted: "bulk_rename_completed";
    readonly BulkRenameFailed: "bulk_rename_failed";
    readonly AchievementUnlocked: "achievement_unlocked";
    readonly PodcastEpisodePublished: "podcast_episode_published";
    readonly PodcastFeedUnhealthy: "podcast_feed_unhealthy";
    readonly PodcastDownloadFailed: "podcast_download_failed";
};
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
/**
 * `warning` is a partial success: the operation delivered but something inside it did not.
 * It must reach a user who asked to hear about problems, which is why `problems` admits
 * both `warning` and `error`.
 */
export declare const NotificationSeverity: {
    readonly Success: "success";
    readonly Warning: "warning";
    readonly Error: "error";
};
export type NotificationSeverity = (typeof NotificationSeverity)[keyof typeof NotificationSeverity];
export declare const NOTIFICATION_CATEGORY_IDS: readonly ["scanning", "metadata", "bookDock", "bookRequests", "authorEnrichment", "email", "migration", "fileWriteBack", "fileRename", "bulkRename", "achievements", "podcasts"];
export type NotificationCategory = (typeof NOTIFICATION_CATEGORY_IDS)[number];
export interface NotificationTypeMeta {
    category: NotificationCategory;
    severity: NotificationSeverity;
}
/**
 * Single source of truth for what a notification type *is*. Anything that needs to know a type's
 * category, colour, icon or severity reads it from here. Keeping a parallel copy on the client is
 * what let `bulk_rename_failed` render as a success for as long as it did.
 */
export declare const NOTIFICATION_TYPE_META: Record<NotificationType, NotificationTypeMeta>;
export declare const NOTIFICATION_CATEGORIES: Record<NotificationCategory, readonly NotificationType[]>;
export declare const NotificationLevel: {
    readonly Off: "off";
    /** Warnings and errors only. */
    readonly Problems: "problems";
    readonly All: "all";
};
export type NotificationLevel = (typeof NotificationLevel)[keyof typeof NotificationLevel];
export type NotificationPreferences = {
    [K in NotificationCategory]?: NotificationLevel | boolean;
};
export declare function isProblemSeverity(severity: NotificationSeverity): boolean;
/**
 * Categories with no warning or error member cannot express "problems only"; there, the level
 * would silently mean the same as "off". Callers use this to render a two-state toggle instead of
 * offering a third option that does nothing.
 */
export declare function categorySupportsProblemsLevel(category: NotificationCategory): boolean;
export declare function availableLevelsForCategory(category: NotificationCategory): readonly NotificationLevel[];
/**
 * Accepts the legacy boolean shape so stored preferences need no migration:
 * `false` meant "category off", anything else meant "send everything".
 */
export declare function resolveNotificationLevel(raw: unknown): NotificationLevel;
export declare function isNotificationAllowed(level: NotificationLevel, severity: NotificationSeverity): boolean;
export interface NotificationItem {
    id: number;
    type: NotificationType;
    title: string;
    message: string | null;
    actionUrl: string | null;
    meta: Record<string, unknown> | null;
    read: boolean;
    /** Number of occurrences collapsed into this row. 1 for an uncollapsed notification. */
    count: number;
    createdAt: string;
    updatedAt: string;
}
export interface NotificationPage {
    items: NotificationItem[];
    total: number;
}
//# sourceMappingURL=notification.d.ts.map