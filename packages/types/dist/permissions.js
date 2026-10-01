"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSION_REQUIRES = exports.PERMISSION_LABELS = exports.Permission = void 0;
exports.withRequiredPermissions = withRequiredPermissions;
var Permission;
(function (Permission) {
    // Content
    Permission["LibraryDownload"] = "library_download";
    Permission["LibraryUpload"] = "library_upload";
    Permission["LibraryEditMetadata"] = "library_edit_metadata";
    Permission["LibraryDeleteBooks"] = "library_delete_books";
    Permission["BookDockAccess"] = "book_dock_access";
    Permission["BookRequestAccess"] = "book_request_access";
    Permission["PodcastManageFeeds"] = "podcast_manage_feeds";
    Permission["PodcastDownload"] = "podcast_download";
    Permission["PodcastEditMetadata"] = "podcast_edit_metadata";
    Permission["PodcastManageRetention"] = "podcast_manage_retention";
    Permission["PodcastPurge"] = "podcast_purge";
    Permission["DemoRestricted"] = "demo_restricted";
    // Devices & Access
    Permission["KoboSync"] = "kobo_sync";
    Permission["KoreaderSync"] = "koreader_sync";
    Permission["HardcoverSync"] = "hardcover_sync";
    Permission["ReadwiseSync"] = "readwise_sync";
    Permission["StorygraphSync"] = "storygraph_sync";
    Permission["OpdsAccess"] = "opds_access";
    // Email
    Permission["EmailSend"] = "email_send";
    Permission["ManageEmail"] = "manage_email";
    // Administration
    Permission["ManageLibraries"] = "manage_libraries";
    Permission["ManageMetadataConfig"] = "manage_metadata_config";
    Permission["ManageIcons"] = "manage_icons";
    Permission["ManageAppSettings"] = "manage_app_settings";
    Permission["ManageBookDock"] = "manage_book_dock";
    Permission["ManageBookRequests"] = "manage_book_requests";
    Permission["BookRequestAutoApprove"] = "book_request_auto_approve";
    Permission["BookRequestSelfFulfill"] = "book_request_self_fulfill";
    Permission["ManageUsers"] = "manage_users";
    Permission["ViewUserActivity"] = "view_user_activity";
    Permission["ViewAuditLog"] = "view_audit_log";
    // Notifications
    Permission["NotificationAccess"] = "notification_access";
})(Permission || (exports.Permission = Permission = {}));
exports.PERMISSION_LABELS = {
    [Permission.LibraryDownload]: "Download books",
    [Permission.LibraryUpload]: "Upload books",
    [Permission.LibraryEditMetadata]: "Edit metadata",
    [Permission.LibraryDeleteBooks]: "Delete books",
    [Permission.BookDockAccess]: "Book Dock",
    [Permission.BookRequestAccess]: "Request books",
    [Permission.PodcastManageFeeds]: "Manage podcast feeds",
    [Permission.PodcastDownload]: "Download podcast episodes",
    [Permission.PodcastEditMetadata]: "Edit podcast metadata",
    [Permission.PodcastManageRetention]: "Manage podcast retention",
    [Permission.PodcastPurge]: "Purge podcast content",
    [Permission.DemoRestricted]: "Demo restricted",
    [Permission.KoboSync]: "Kobo sync",
    [Permission.KoreaderSync]: "KOReader sync",
    [Permission.HardcoverSync]: "Hardcover sync",
    [Permission.ReadwiseSync]: "Readwise sync",
    [Permission.StorygraphSync]: "StoryGraph sync",
    [Permission.OpdsAccess]: "OPDS access",
    [Permission.EmailSend]: "Send by email",
    [Permission.ManageEmail]: "Manage email",
    [Permission.ManageLibraries]: "Manage libraries",
    [Permission.ManageMetadataConfig]: "Metadata config",
    [Permission.ManageIcons]: "Manage icons",
    [Permission.ManageAppSettings]: "App settings",
    [Permission.ManageBookDock]: "Manage Book Dock",
    [Permission.ManageBookRequests]: "Manage book requests",
    [Permission.BookRequestAutoApprove]: "Auto-approve requests",
    [Permission.BookRequestSelfFulfill]: "Download books directly",
    [Permission.ManageUsers]: "Manage users",
    [Permission.ViewUserActivity]: "View user activity",
    [Permission.ViewAuditLog]: "View audit log",
    [Permission.NotificationAccess]: "Notifications",
};
/**
 * Permissions that are inert without another one, and the dependency is enforced when permissions
 * are assigned rather than implied when they are checked.
 *
 * Implying at check time would be the shorter fix and the wrong one: a token holding only
 * `BookRequestSelfFulfill` would start passing every `BookRequestAccess` route, which is exactly
 * the claim the authorization matrix exists to make and would no longer be true.
 */
exports.PERMISSION_REQUIRES = {
    // Self-fulfilment adds a way to fulfil a request. Listing, viewing and the live queue all
    // answer to `BookRequestAccess`, so granting one without the other buys nothing at all.
    [Permission.BookRequestSelfFulfill]: [Permission.BookRequestAccess],
    // Moderating the queue is a superset of using it, not a separate thing: the summary, the detail
    // route, the websocket, and the moderator branches of cancel and language all sit behind
    // `BookRequestAccess`. Granted alone this produced an approver with no sidebar entry who was
    // refused by every route except the queue list.
    [Permission.ManageBookRequests]: [Permission.BookRequestAccess],
    // Auto-approve only decides what happens to a request the holder submits, so it says nothing
    // at all without the permission that lets them submit one.
    [Permission.BookRequestAutoApprove]: [Permission.BookRequestAccess],
};
/** Every permission the given selection implies must also be held, itself included. */
function withRequiredPermissions(permissions) {
    const resolved = new Set(permissions);
    for (const permission of permissions) {
        for (const required of exports.PERMISSION_REQUIRES[permission] ?? [])
            resolved.add(required);
    }
    return [...resolved];
}
