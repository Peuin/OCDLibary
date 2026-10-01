"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PODCAST_OPML_OMITTED_HEADER = exports.PODCAST_IMPORT_MAX_RESOLUTIONS = exports.PODCAST_IMPORT_REPORT_GROUP_LIMIT = exports.PODCAST_BULK_DELETE_MAX_SHOWS = exports.PODCAST_CREATE_SOURCES = exports.PODCAST_DIRECTORY_SEARCH_MAX_QUERY = exports.PODCAST_DIRECTORY_SEARCH_MAX_RESULTS = exports.PODCAST_STATE_BATCH_LIMIT = exports.PODCAST_PLAYLIST_MAX_PUBLISHED_WITHIN_DAYS = exports.PODCAST_PLAYLIST_MAX_DURATION_MINUTES = exports.PODCAST_PLAYLIST_MAX_SAVED = exports.PODCAST_PLAYLIST_MAX_SHOWS = exports.PODCAST_PLAYLIST_QUEUE_LIMIT = exports.PODCAST_EPISODE_MAX_CHAPTERS = exports.PODCAST_EPISODE_MAX_DURATION_SECONDS = exports.PODCAST_EPISODE_TYPES = exports.PODCAST_EPISODE_LOCKED_FIELDS = exports.PODCAST_MAX_CATEGORIES = exports.PODCAST_EDITABLE_FIELDS = exports.PODCAST_LOCKED_FIELDS = exports.PODCAST_NOTIFICATION_MODES = exports.PODCAST_ERROR_CODES = void 0;
/**
 * Stable `errorCode` values on the responses that refuse a podcast operation. Client copy is keyed
 * off these, never off the server's English message.
 */
exports.PODCAST_ERROR_CODES = {
    /** A local show has no feed to refresh or reparse. */
    localNoRefresh: "PODCAST_LOCAL_NO_REFRESH",
    /** A local episode has no enclosure to download; its file is already the only copy. */
    localNoDownload: "PODCAST_LOCAL_NO_DOWNLOAD",
    /** A local episode's file belongs to the user, so BookOrbit will not delete it on their behalf. */
    localFileNotRemovable: "PODCAST_LOCAL_FILE_NOT_REMOVABLE",
    /** A local episode's only copy is gone from disk. The media row is now `unavailable`. */
    localMediaMissing: "PODCAST_LOCAL_MEDIA_MISSING",
    /** A folder cannot become a local show because it holds no importable audio. */
    localFolderEmpty: "PODCAST_LOCAL_FOLDER_EMPTY",
    /** Retention could not free enough room, usually because local-origin files cannot be evicted. */
    storageFull: "PODCAST_STORAGE_FULL",
    /**
     * This library already holds the feed being added or previewed. The response carries
     * `podcastId`, so a client can offer to open the existing show instead of recovering its identity
     * from the message text.
     */
    duplicateFeed: "PODCAST_DUPLICATE_FEED",
};
exports.PODCAST_NOTIFICATION_MODES = ["off", "immediate", "daily", "weekly"];
/**
 * Show fields a user can pin against feed refreshes. Shared by the server DTO validation and the
 * client editor so both agree on which names the lock set may contain.
 */
exports.PODCAST_LOCKED_FIELDS = [
    "title",
    "author",
    "description",
    "imageUrl",
    "siteUrl",
    "language",
    "podcastType",
    "explicit",
    "categories",
];
/** Show fields the metadata endpoint accepts. `podcastType` stays feed-owned and is lockable only. */
exports.PODCAST_EDITABLE_FIELDS = ["title", "author", "description", "siteUrl", "language", "explicit", "categories"];
exports.PODCAST_MAX_CATEGORIES = 100;
/**
 * Episode fields a user can pin against feed refreshes. Exactly the fields the refresh upsert
 * guards per lock; `guid`, the enclosure fields and `transcripts` are identity and delivery data
 * that always take the feed value, so they are absent here on purpose.
 */
exports.PODCAST_EPISODE_LOCKED_FIELDS = [
    "title",
    "subtitle",
    "description",
    "publishedAt",
    "season",
    "episode",
    "episodeType",
    "durationSeconds",
    "explicit",
    "chapters",
];
/** The iTunes episode types. A feed may publish anything, but an edit has to pick one of these or clear the field. */
exports.PODCAST_EPISODE_TYPES = ["full", "trailer", "bonus"];
/** One year, the same ceiling the feed parser applies to a published duration. */
exports.PODCAST_EPISODE_MAX_DURATION_SECONDS = 31_536_000;
exports.PODCAST_EPISODE_MAX_CHAPTERS = 1000;
exports.PODCAST_PLAYLIST_QUEUE_LIMIT = 100;
exports.PODCAST_PLAYLIST_MAX_SHOWS = 50;
exports.PODCAST_PLAYLIST_MAX_SAVED = 50;
/** A day is the longest episode worth expressing, and ten years the longest publication window. */
exports.PODCAST_PLAYLIST_MAX_DURATION_MINUTES = 1_440;
exports.PODCAST_PLAYLIST_MAX_PUBLISHED_WITHIN_DAYS = 3_650;
exports.PODCAST_STATE_BATCH_LIMIT = 200;
exports.PODCAST_DIRECTORY_SEARCH_MAX_RESULTS = 50;
exports.PODCAST_DIRECTORY_SEARCH_MAX_QUERY = 200;
/** Which way content enters a podcast library: subscribed from an address, or adopted from disk. */
exports.PODCAST_CREATE_SOURCES = ["feed", "folder"];
/** How many shows one bulk delete may name. Keeps a runaway selection from queueing unbounded work. */
exports.PODCAST_BULK_DELETE_MAX_SHOWS = 200;
/** How many entries each report group carries. The counts stay exact once a group is capped. */
exports.PODCAST_IMPORT_REPORT_GROUP_LIMIT = 500;
exports.PODCAST_IMPORT_MAX_RESOLUTIONS = 500;
/**
 * How many local shows an OPML export left out. OPML carries one `xmlUrl` per show and a local show
 * has none, so the count travels in a response header rather than silently disappearing.
 */
exports.PODCAST_OPML_OMITTED_HEADER = "x-podcast-local-shows-omitted";
