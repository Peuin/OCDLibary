export declare enum Permission {
    LibraryDownload = "library_download",
    LibraryUpload = "library_upload",
    LibraryEditMetadata = "library_edit_metadata",
    LibraryDeleteBooks = "library_delete_books",
    BookDockAccess = "book_dock_access",
    BookRequestAccess = "book_request_access",
    PodcastManageFeeds = "podcast_manage_feeds",
    PodcastDownload = "podcast_download",
    PodcastEditMetadata = "podcast_edit_metadata",
    PodcastManageRetention = "podcast_manage_retention",
    PodcastPurge = "podcast_purge",
    DemoRestricted = "demo_restricted",
    KoboSync = "kobo_sync",
    KoreaderSync = "koreader_sync",
    HardcoverSync = "hardcover_sync",
    ReadwiseSync = "readwise_sync",
    StorygraphSync = "storygraph_sync",
    OpdsAccess = "opds_access",
    EmailSend = "email_send",
    ManageEmail = "manage_email",
    ManageLibraries = "manage_libraries",
    ManageMetadataConfig = "manage_metadata_config",
    ManageIcons = "manage_icons",
    ManageAppSettings = "manage_app_settings",
    ManageBookDock = "manage_book_dock",
    ManageBookRequests = "manage_book_requests",
    BookRequestAutoApprove = "book_request_auto_approve",
    BookRequestSelfFulfill = "book_request_self_fulfill",
    ManageUsers = "manage_users",
    ViewUserActivity = "view_user_activity",
    ViewAuditLog = "view_audit_log",
    NotificationAccess = "notification_access"
}
export declare const PERMISSION_LABELS: Record<Permission, string>;
/**
 * Permissions that are inert without another one, and the dependency is enforced when permissions
 * are assigned rather than implied when they are checked.
 *
 * Implying at check time would be the shorter fix and the wrong one: a token holding only
 * `BookRequestSelfFulfill` would start passing every `BookRequestAccess` route, which is exactly
 * the claim the authorization matrix exists to make and would no longer be true.
 */
export declare const PERMISSION_REQUIRES: Partial<Record<Permission, readonly Permission[]>>;
/** Every permission the given selection implies must also be held, itself included. */
export declare function withRequiredPermissions(permissions: readonly Permission[]): Permission[];
//# sourceMappingURL=permissions.d.ts.map